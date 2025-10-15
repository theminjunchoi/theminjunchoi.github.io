---
title: How Redis Pub/Sub Works
date: 2025-10-14 09:44:21
updated: 2025-10-15 09:49:09
publish: true
tags:
  - CoffeeShout
series: 커피빵(CoffeeShout) 개발록
---
[[coffeeshout_infra_design]] 지난 글에서 이어집니다!
## Redis pub/sub

Redis Pub/Sub의 동작 원리를 이해하면 왜 이 방식이 실시간 게임 동기화에 적합한지 명확해진다.

### Redis 내부 구조

Redis 서버는 C로 구현되어 있으며, Pub/Sub 기능은 내부적으로 매우 단순한 자료구조로 동작한다. Redis 서버의 `redisServer` 구조체는 다음과 같은 Pub/Sub 관련 정보를 메모리에 유지한다:

```c
struct redisServer {
    dict *pubsub_channels;  // 채널명 → 구독자 리스트 해시테이블
    list *pubsub_patterns;  // 패턴 구독자들 링크드리스트
    // ...
}
```

클라이언트가 `SUBSCRIBE room.events`를 실행하면, Redis는 `pubsub_channels` 해시테이블에서 해당 채널을 찾고, 구독자 리스트에 클라이언트를 추가한다. 이후 `PUBLISH room.events {...}` 메시지가 들어오면, 해시테이블에서 채널을 O(1)로 조회하고 구독자 리스트를 순회하며 메시지를 전송한다.

### 메시지 전달 흐름

커피빵 서비스에서 플레이어가 Ready 상태를 변경하는 과정을 예로 들어보자.

#### 1. 클라이언트가 WebSocket으로 메시지 전송

```javascript
// 브라우저에서 전송
stompClient.send('/app/room/ABC123/update-ready', {}, JSON.stringify({
  joinCode: "ABC2",
  playerName: "홍길동",
  isReady: true
}));
```

#### 2. Spring WebSocket Controller가 수신

```java
@MessageMapping("/room/{joinCode}/update-ready")
public void broadcastReady(@DestinationVariable String joinCode, 
                          ReadyChangeMessage message) {
    final PlayerReadyEvent event = new PlayerReadyEvent(
        joinCode, 
        message.playerName(),
        message.isReady()
    );
    roomEventPublisher.publishEvent(event);
}
```

Spring이 STOMP 프로토콜로 들어온 메시지를 파싱해 컨트롤러로 라우팅한다. 이후 도메인 이벤트인 `PlayerReadyEvent`를 생성하며, 이때 이벤트 ID와 타임스탬프가 자동으로 생성된다.

#### 3. RedisTemplate의 convertAndSend()

```java
public <T extends RoomBaseEvent> void publishEvent(T event) {
    redisTemplate.convertAndSend(roomEventTopic.getTopic(), event);
}
```

`RedisTemplate`은 Spring Data Redis가 제공하는 추상화 레이어다. 내부에서는 다음 과정이 순차적으로 실행된다.

```java
// RedisTemplate 내부 동작
public void convertAndSend(String channel, Object message) {
    // 1. 채널명 직렬화: "room.events" → byte[]
    byte[] rawChannel = "room.events".getBytes(StandardCharsets.UTF_8);
    
    // 2. 메시지 객체 직렬화: PlayerReadyEvent → JSON → byte[]
    GenericJackson2JsonRedisSerializer serializer = ...;
    byte[] rawMessage = serializer.serialize(event);
    // 결과: {"eventId":"uuid-123","joinCode":"ABC2","playerName":"홍길동","isReady":true,...}
    
    // 3. Lettuce Connection으로 전달
    connection.publish(rawChannel, rawMessage);
}
```

#### 4. Lettuce의 RESP 프로토콜 변환

Lettuce는 Netty 기반의 비동기 Redis 클라이언트다. Redis와 통신하기 위해서는 **RESP(REdis Serialization Protocol)**라는 Redis 전용 프로토콜로 변환해야 한다.

RESP는 Redis의 표준 통신 규약으로, 텍스트 기반의 간단한 프로토콜이다. 각 데이터 타입을 특정 문자로 시작해 구분한다:

- `*` : 배열 (Array)
- `$` : 문자열 길이 (Bulk String)
- `:` : 정수 (Integer)
- `+` : 단순 문자열 (Simple String)
- `-` : 에러 (Error)

예를 들어 `PUBLISH room.events {"data":"..."}` 명령은 다음과 같이 변환된다:

```
*3\r\n
$7\r\n
PUBLISH\r\n
$11\r\n
room.events\r\n
$152\r\n
{"eventId":"uuid-123","joinCode":"ABC2","playerName":"홍길동","isReady":true,...}\r\n
```

해석하면:

- `*3`: 3개 요소를 가진 배열
- `$7`: 7바이트 문자열 → `PUBLISH`
- `$11`: 11바이트 문자열 → `room.events`
- `$152`: 152바이트 문자열 → JSON 메시지

Lettuce 내부 코드로 보면 다음과 같다

```java
// Lettuce 내부
public Long publish(byte[] channel, byte[] message) {
    // RESP 프로토콜로 인코딩
    CommandArgs<byte[], byte[]> args = new CommandArgs<>(codec)
        .addKey(channel)   // room.events
        .addValue(message); // JSON 메시지
    
    Command<byte[], byte[], Long> command = commandBuilder.publish(args);
    
    // Netty를 통해 비동기 전송
    return dispatch(command);
}
```

Lettuce는 Netty의 `ByteBuf`에 RESP 형식의 바이트 데이터를 작성한 뒤, 비동기로 전송한다.

#### 5. Netty의 비동기 네트워크 통신

Netty는 Java NIO를 기반으로 한 비동기 네트워크 프레임워크다. Lettuce가 Netty를 사용하는 이유는 **논블로킹 I/O**와 **커넥션 재사용** 때문이다.

```java
// Netty 내부 (간략화)
Channel channel = getChannel(); // Redis 서버와의 TCP 연결

// ByteBuf에 RESP 데이터 작성
ByteBuf buffer = channel.alloc().buffer();
buffer.writeBytes(respProtocolBytes);

// 비동기 전송
ChannelFuture future = channel.writeAndFlush(buffer);

// 결과를 기다리지 않고 즉시 리턴 (Non-blocking)
future.addListener(writeCompleteListener);
```

Netty는 내부적으로 **이벤트 루프(Event Loop)** 스레드를 사용해 여러 커넥션의 I/O를 효율적으로 처리한다. 하나의 스레드가 수천 개의 커넥션을 동시에 관리할 수 있어, 커넥션마다 스레드를 생성하는 전통적인 방식보다 훨씬 효율적이다.

최종적으로 TCP 소켓을 통해 Redis 서버로 데이터가 전송된다.

#### 6. Redis 서버의 메시지 처리

Redis 서버는 **단일 스레드 이벤트 루프** 구조로 동작한다. 멀티스레딩 없이 어떻게 수천 개의 동시 연결을 처리할 수 있을까? 바로 **I/O 멀티플렉싱(I/O Multiplexing)** 기술 덕분이다.

**I/O 멀티플렉싱이란?**

전통적인 블로킹 I/O 방식에서는 `read()`를 호출하면 데이터가 도착할 때까지 스레드가 대기한다. 1000개의 클라이언트를 처리하려면 1000개의 스레드가 필요하고, 이는 컨텍스트 스위칭 비용으로 성능 저하를 일으킨다.

I/O 멀티플렉싱은 **하나의 스레드가 여러 소켓을 동시에 감시**할 수 있게 해준다. Linux의 `epoll`, BSD/macOS의 `kqueue` 같은 시스템 콜이 이 기능을 제공한다.

동작 방식:

1. 수백~수천 개의 소켓을 `epoll`에 등록
2. `epoll_wait()` 호출 → 이벤트(데이터 도착, 쓰기 가능 등) 발생 시까지 대기
3. 이벤트 발생 시 어떤 소켓에서 이벤트가 발생했는지 반환
4. 해당 소켓에서만 `read()` 또는 `write()` 수행
5. 다시 `epoll_wait()`로 돌아가 다음 이벤트 대기

Redis는 이 방식으로 단일 스레드로도 초당 수만 건의 요청을 처리한다.

```c
// Redis 이벤트 루프 (간략화)
void aeMain(aeEventLoop *eventLoop) {
    while (!eventLoop->stop) {
        // epoll_wait() 호출 - 이벤트 발생 시까지 대기
        numevents = aeApiPoll(eventLoop, tvp);
        
        for (int j = 0; j < numevents; j++) {
            aeFileEvent *fe = &eventLoop->events[eventLoop->fired[j].fd];
            
            // 읽기 이벤트 (클라이언트가 데이터 전송)
            if (fe->mask & AE_READABLE) {
                fe->rfileProc(eventLoop, fd, fe->clientData, mask);
            }
            
            // 쓰기 이벤트 (클라이언트에게 전송 가능)
            if (fe->mask & AE_WRITABLE) {
                fe->wfileProc(eventLoop, fd, fe->clientData, mask);
            }
        }
    }
}
```

클라이언트가 `PUBLISH` 명령을 보내면:

```c
// 1. 소켓에서 데이터 읽기 (간략화)
void readQueryFromClient(aeEventLoop *el, int fd, void *privdata, int mask) {
    client *c = (client*) privdata;
    
    // TCP 소켓에서 데이터 읽기
    nread = read(fd, c->querybuf + qblen, readlen);
    
    // RESP 프로토콜 파싱
    processInputBuffer(c);
}

// 2. PUBLISH 명령 실행 (간략화)
void publishCommand(client *c) {
    // c->argv[1] = "room.events" (채널명)
    // c->argv[2] = JSON 메시지
    
    int receivers = 0;
    
    // pubsub_channels 해시테이블에서 채널 조회 (O(1))
    dictEntry *de = dictFind(server.pubsub_channels, c->argv[1]);
    
    if (de) {
        list *subscribers = dictGetVal(de);
        
        // 구독자 리스트 순회 (O(N), N=구독자 수)
        listNode *ln;
        listIter li;
        listRewind(subscribers, &li);
        
        while ((ln = listNext(&li)) != NULL) {
            client *subscriber = ln->value;
            
            // 각 구독자의 output buffer에 메시지 추가
            addReplyPubsubMessage(subscriber, c->argv[1], c->argv[2]);
            receivers++;
        }
    }
    
    // 발행자에게 응답: 몇 명에게 전송했는지
    addReplyLongLong(c, receivers);
}

// 3. output buffer의 데이터를 실제로 전송 (간략화)
void writeToClient(int fd, client *c, int handler_installed) {
    while (clientHasPendingReplies(c)) {
        // write() 시스템콜로 TCP 소켓에 전송
        nwritten = write(fd, c->buf + c->sentlen, c->bufpos - c->sentlen);
        
        if (nwritten <= 0) break;
        
        c->sentlen += nwritten;
    }
}
```

이 과정에서 Redis는 메시지를 저장하지 않는다. 받자마자 바로 구독자들의 output buffer에 추가하고 전송한다. 이것이 **Fire-and-Forget** 방식이며, 실시간성을 극대화하는 설계다.

#### 7. 구독자 측 수신 및 처리

각 서버 인스턴스의 Lettuce 클라이언트가 메시지를 수신하면, RESP 프로토콜을 디코딩해 Spring의 `MessageListener`로 전달한다.

```java
@Override
public void onMessage(Message message, byte[] pattern) {
    // 1. 메시지 body를 String으로 변환
    String body = new String(message.getBody());
    
    // 2. eventType 추출
    RoomEventType eventType = extractEventType(body); // PLAYER_READY
    
    // 3. JSON을 Java 객체로 역직렬화
    PlayerReadyEvent event = objectMapper.readValue(body, PlayerReadyEvent.class);
    
    // 4. 핸들러로 위임
    RoomEventHandler handler = handlerFactory.getHandler(eventType);
    handler.handle(event);
}
```

#### 8. 비즈니스 로직 실행

```java
@Override
public void handle(PlayerReadyEvent event) {
    // 로컬 메모리에서 Room 조회 (네트워크 통신 없음)
    Room room = roomQueryService.getByJoinCode(new JoinCode(event.joinCode()));
    
    // Player 찾기
    Player player = room.findPlayer(new PlayerName(event.playerName()));
    
    // 상태 변경 (로컬 메모리)
    player.updateReadyState(event.isReady());
    
    // 로컬 캐시 업데이트
    roomCommandService.save(room);
    
    // WebSocket 브로드캐스팅
    List<PlayerResponse> responses = room.getPlayers().stream()
        .map(PlayerResponse::from)
        .toList();
    
    messagingTemplate.convertAndSend(
        "/topic/room/" + event.joinCode(),
        WebSocketResponse.success(responses)
    );
}
```

여기서 핵심은 **데이터 조회가 로컬 메모리에서 즉시 처리**된다는 점이다. 네트워크 통신도, 직렬화/역직렬화도 필요 없다. Redis는 오직 변경 이벤트를 전파하는 메시지 브로커 역할만 수행한다.

#### 9. 최종 클라이언트 수신

Spring WebSocket이 STOMP 프로토콜로 메시지를 인코딩해 해당 방을 구독 중인 모든 WebSocket 세션에 전송한다. 각 브라우저는 메시지를 수신해 UI를 업데이트한다.


```javascript
stompClient.subscribe('/topic/room/ABC123', (message) => {
    const response = JSON.parse(message.body);
    // {success: true, data: [{playerName: "홍길동", isReady: true}, ...]}
    
    updatePlayerList(response.data);
});
```

### 주요 특징과 트레이드오프

#### Fire-and-Forget 방식

Redis Pub/Sub은 메시지를 저장하지 않는다. 구독자가 없거나 네트워크 문제로 수신하지 못하면 메시지는 유실된다. 이는 실시간성을 위한 설계 선택이다. 메시지 저장 없이 즉시 전달만 하기 때문에 레이턴시가 최소화된다.

커피빵의 경우 대부분의 이벤트가 일시적 상태 변경(Ready 상태, 메뉴 선택 등)이기 때문에 이런 특성이 오히려 적합했다. 메시지 유실을 무조건 막아야하거나 Race Condition이 발생할 수 있는 상황을 대비해서 일정부분은 Redis Stream을 적용했다.

#### 네트워크 레이턴시

전체 메시지 전파 과정에서 발생하는 네트워크 구간은 다음과 같다:

1. 발행 서버 → Redis (TCP 왕복)
2. Redis → 구독 서버들 (TCP 왕복 × N)

동일 리전 내에서는 대략 1~5ms 정도의 지연이 발생한다. 이는 사람이 체감하기 어려운 수준이다.
#### 언어 경계를 넘는 통신

흥미로운 점은 이 전체 과정에서 **여러 언어와 프로토콜의 경계를 넘는다**는 것이다.

- Java 애플리케이션에서 이벤트 발행
- Lettuce(Java)가 RESP 프로토콜로 변환
- 네트워크를 타고 Redis(C)로 전달
- Redis가 C 레벨의 해시테이블과 링크드리스트로 처리
- 다시 네트워크를 타고 구독자의 Lettuce(Java)로 수신
- Java 객체로 복원돼 비즈니스 로직 실행

각 언어는 서로 다른 메모리 관리 방식과 자료구조를 사용하지만, RESP 프로토콜이라는 공통 인터페이스를 통해 안정적으로 통신한다. 이런 추상화 덕분에 개발자는 Redis 내부 구현을 몰라도 Pub/Sub을 사용할 수 있다.

다만 이런 경계를 넘을 때마다 직렬화/역직렬화와 네트워크 비용이 발생한다는 점은 항상 염두에 둬야 한다. 그럼에도 불구하고 이 방식을 선택한 이유는, **읽기 작업은 로컬 메모리에서 즉시 처리되고, 쓰기 작업만 네트워크를 타기 때문**이다. 결과적으로 성능 저하 없이 분산 환경 동기화를 달성할 수 있었다.

## 참고자료

### Redis 공식 자료

- [Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/) - Pub/Sub 공식 가이드
- [RESP Protocol Specification](https://redis.io/docs/latest/develop/reference/protocol-spec/) - RESP 프로토콜 공식 명세
- [Redis GitHub - pubsub.c](https://github.com/redis/redis/blob/unstable/src/pubsub.c) - Pub/Sub 구현 소스코드

### Redis 내부 구조 분석

- [Redis Pub/Sub under the hood](https://jameshfisher.com/2017/03/01/redis-pubsub-under-the-hood/) - Redis Pub/Sub 소스코드 상세 분석 (Pusher 엔지니어 작성)




