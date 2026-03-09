---
title: |-
  지연 시간 0ms를 보장하는 Transactional Outbox 도입기
  ⏤ @Transactional 하나가 DB 커넥션 풀을 말려버린 사연과 이중 쓰기(Dual Write) 극복
date: 2026-03-08 01:19:31
updated: 2026-03-10 00:59:57
publish: true
tags:
  - ZZOL
  - dual-write
  - spring
  - transactional-outbox
series: ZZOL 개발록
---
## DB 커밋은 됐는데 이벤트가 사라진다

ZZOL은 실시간 멀티플레이어 게임 서비스다. 방 생성, 룰렛 스핀, 미니게임 결과 같은 핵심 비즈니스 이벤트를 Redis Stream으로 브로드캐스트해서 WebSocket 클라이언트에게 전달하는 구조로 되어 있다.

문제는 `RoomService.createRoom()`에 있었다. 코드를 보면 흐름이 이렇다.

```java
@Transactional
public Room createRoom(String hostName) {
    final Room room = roomCommandService.saveIfAbsentRoom(joinCode, new PlayerName(hostName));

    // 여기서 Redis Stream에 직접 쏜다
    streamPublisher.publish(StreamKey.ROOM_BROADCAST, event);

    saveRoomEntity(joinCode.getValue());  // DB 저장

    return room;
}
```

이 코드의 문제는 두 가지다. 첫째, `streamPublisher.publish()`가 트랜잭션 커밋 전에 호출된다. 트랜잭션이 롤백되면 Redis에는 이벤트가 남아있고 DB에는 데이터가 없는 유령 이벤트가 발생한다. 둘째, 트랜잭션이 성공적으로 커밋되더라도 그 직후 Redis 장애나 네트워크 타임아웃이 발생하면 DB에는 데이터가 있는데 다른 서버 인스턴스는 이벤트를 못 받는 상황이 된다.

이 두 가지를 합쳐서 Dual Write Problem이라고 부른다. DB와 Redis라는 두 개의 저장소에 동시에 쓰는데, 둘 다 성공하거나 둘 다 실패하는 것을 보장할 수 없는 구조적 문제다.

## Transactional Outbox 패턴이 맞는 해법인가

해법을 고르기 전에 선택지를 먼저 정리했다.

### 선택지 1: Redis 발행을 트랜잭션 안에서 보장하기

Redis는 MySQL과 XA 트랜잭션을 지원하지 않는다. 2PC(Two-Phase Commit)는 물리적으로 불가능하다. 설령 가능하더라도 분산 트랜잭션은 지연 시간과 복잡도 면에서 실시간 게임 서비스에 쓸 수 없다. 탈락.

### 선택지 2: 이벤트 발행 실패 시 비즈니스 트랜잭션 롤백

"Redis 발행 실패하면 DB도 롤백하면 되지 않느냐"는 접근이다. 일관성은 유지되지만 가용성이 망가진다. Redis가 30초만 장애가 나도 방 생성, 룰렛, 미니게임 전체가 먹통이 된다. Redis 장애가 비즈니스 로직의 가용성을 직접 갉아먹는 구조는 받아들일 수 없었다. 탈락.

### 선택지 3: Kafka + Debezium (CDC 기반)

Outbox 테이블에 레코드를 쓰면 Debezium이 MySQL binlog를 감시해서 자동으로 Kafka에 이벤트를 발행하는 구조다. 이론적으로 가장 깔끔하다. 하지만 현실을 보면, 현재 인프라는 단일 MySQL + 단일 Redis다. Kafka 클러스터와 Debezium 커넥터를 올리는 건 운영 복잡도를 몇 배로 키운다. 이건 오버엔지니어링이라 판단해서 탈락.

### 선택지 4: Transactional Outbox + Polling Publisher

비즈니스 트랜잭션 안에서 DB에 이벤트 레코드를 함께 저장하고, 별도 스케줄러가 주기적으로 Outbox 테이블을 폴링해서 Redis Stream에 발행하는 구조다.

이 방식의 장점은 명확하다. 비즈니스 데이터와 이벤트가 같은 MySQL 트랜잭션 안에서 커밋되므로 원자성이 보장된다. Redis 장애가 발생해도 비즈니스 로직은 정상 동작하고, 이벤트는 Outbox에 안전하게 보관된다. Redis가 복구되면 밀린 이벤트가 순서대로 발행된다.

Outbox + Polling Publisher를 선택했다. 현재 스택(Spring Boot 3.x, MySQL, Redis) 안에서 해결 가능하고, 도입 비용 대비 얻는 안정성이 크다고 생각했다.

## Outbox 엔티티 설계

### 어떤 정보를 저장해야 하는가

Outbox 테이블에 넣어야 하는 최소한의 정보를 정리했다.

|컬럼|역할|근거|
|---|---|---|
|id|PK|순서 보장을 위해 AUTO_INCREMENT 사용. Outbox 폴링 시 `id` 기준으로 정렬하면 이벤트 발행 순서가 비즈니스 트랜잭션 커밋 순서와 일치한다|
|stream_key|Redis Stream 키|`StreamKey` enum의 `redisKey` 값. 어느 스트림에 발행할지 결정|
|payload|직렬화된 이벤트 본문|`BaseEvent`를 JSON 직렬화한 문자열. 기존 `StreamPublisher`가 이미 Jackson으로 직렬화하고 있어서 동일한 포맷 사용|
|status|발행 상태|`PENDING` → `IN_PROGRESS` → `PUBLISHED`. 폴링 쿼리의 WHERE 조건이자 동시성 제어의 핵심|
|created_at|생성 시각|모니터링과 디버깅용. PUBLISHED 레코드 정리(cleanup)의 기준이 된다|
|updated_at|마지막 상태 전이 시각|상태가 바뀔 때마다 갱신. IN_PROGRESS 복구 스케줄러가 이 값으로 stale 이벤트를 판별한다|

방어적으로 `retry_count`도 남겼다. 무한 재시도를 막기 위한 최대 재시도 횟수 체크용이다. 10회 이상 실패한 이벤트는 `DEAD_LETTER` 상태로 전환해서 별도로 모니터링한다.

```java
@Entity
@Table(name = "outbox_event")
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String streamKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OutboxStatus status;

    @Column(nullable = false)
    private int retryCount;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
```

상태 전이도에서 `AFTER_COMMIT` 경로와 Worker 경로가 모두 보인다. 평상시에는 `PENDING → PUBLISHED`로 바로 전환되고, Redis 장애 시에만 Worker를 거친다.

```mermaid
flowchart TD
    S(( )) -->|"record()"| P[PENDING]

    P -->|"AFTER_COMMIT"| PUB[PUBLISHED]
    P -->|"Worker<br/>SKIP LOCKED"| IP[IN_PROGRESS]

    IP -->|"publish ok"| PUB
    IP -.->|"fail or stale"| P
    IP -->|"10x fail"| DL[DEAD_LETTER]

    PUB -->|"cleanup 24h"| E(( ))

    style S fill:#000,stroke:#000
    style E fill:#fff,stroke:#000
    style PUB fill:#d4edda,stroke:#28a745
    style DL fill:#f8d7da,stroke:#dc3545
```

## 트랜잭션 경계 설계 — 처음에 틀렸고, 두 번째에도 틀렸다

Outbox 테이블에 이벤트를 저장하는 것까지는 단순하다. 핵심은 **트랜잭션이 확실히 커밋된 후에** Redis Stream으로 이벤트를 릴레이하는 타이밍을 어떻게 잡느냐다. 여기서 세 번의 시행착오를 거쳤다.

### 1차 시도: 폴링 전용 — 전부 Outbox로 돌리자

처음에는 가장 단순한 방식을 선택했다. 모든 `streamPublisher.publish()` 호출을 `outboxEventRecorder.record()`로 교체하고, 500ms 폴링 Worker가 일괄 처리하는 구조다.

|방식|장점|단점|
|---|---|---|
|`AFTER_COMMIT` + 폴링 재시도|평시 지연 0ms. 실패 시에만 폴링|구현 복잡도 증가|
|Polling 전용|구현 단순. 일관된 경로|최대 500ms 지연 발생|

"모든 이벤트가 동일한 경로를 타면 동작의 예측 가능성이 올라간다." 이 논리로 폴링 전용을 선택했다. 테스트를 돌리기 전까지는.

### 현실과 충돌: 기존 테스트 7개가 전멸했다

모든 이벤트를 Outbox 폴링 경로로 바꿨더니 기존 통합 테스트가 줄줄이 깨졌다. 실패 원인을 분석하면 크게 세 가지였다.

**첫 번째: 요청-응답 패턴과의 충돌.** `enterRoomAsync()`는 이벤트를 Redis Stream에 쏘고 `CompletableFuture`로 Consumer의 처리 결과를 5초 안에 기다리는 구조다. Outbox 폴링 500ms 지연이 끼어들면서 타임아웃이 발생했다.

**두 번째: 이벤트 순서 역전.** `createRoom()`이 Outbox에 `RoomCreateEvent`를 저장하면, 500ms 후에야 Consumer에 도달한다. 그 사이에 `enterRoomAsync()`가 `RoomJoinEvent`를 직접 Redis에 쏘면, "방 참가" 이벤트가 "방 생성" 이벤트보다 먼저 처리된다. Consumer가 `방이 존재하지 않습니다` 예외를 던졌다.

**세 번째: 실시간 게임 입력의 체감 지연.** 미니게임 탭 이벤트, 카드 선택 같은 인게임 액션에 500ms 지연이 붙으면 게임이 안 된다.

### 2차 시도: 그러면 Outbox를 다 빼자?

테스트를 고치기 위해 전부 `streamPublisher.publish()` 직접 발행으로 되돌렸다. 테스트는 통과한다. 하지만 이러면 처음에 해결하려던 Dual Write Problem이 그대로 살아난다. `createRoom()`에서 DB 커밋은 됐는데 Redis 발행이 실패하면 유령 방이 생긴다.

### 3차 시도: 이벤트 발행 경로를 분류하자

코드베이스의 모든 `streamPublisher.publish()` 호출을 전수 조사해서 분류했다.

|경로|DB 변경|실시간성|Outbox 필요?|이유|
|---|---|---|---|---|
|`createRoom()`|`saveRoomEntity()`|즉시 필요|**필요**|DB 저장과 이벤트 발행의 원자성 보장|
|`enterRoomAsync()`|없음 (Consumer에서)|즉시 필요|불필요|CompletableFuture 요청-응답 패턴|
|WebSocket 컨트롤러|없음|즉시 필요|불필요|사용자 인터랙션 실시간 응답|
|미니게임/레이싱 입력|없음|즉시 필요|불필요|0.1초가 중요한 인게임 액션|
|세션 이벤트, QR코드|없음|준실시간|불필요|DB 원자성 불필요|

**Outbox가 필요한 경로는 `createRoom()` 하나뿐이었다.** DB 상태 변경과 이벤트 발행이 같은 트랜잭션에서 원자적으로 일어나야 하는 유일한 지점이다.

하지만 여기에 500ms 폴링 지연을 넣으면 이벤트 순서 역전이 발생한다. 지연 시간 0ms를 보장하면서도 원자성을 지키는 방법이 필요했다.

## 2단 Outbox — AFTER_COMMIT 즉시 발행 + 폴링 재시도

처음에 "구현 복잡도" 때문에 버렸던 `@TransactionalEventListener(AFTER_COMMIT)` 카드를 다시 꺼냈다. 1차 시도에서 이걸 포기한 이유는 "트랜잭션이 없는 호출 경로에서 동작이 달라진다"였는데, 이제 Outbox를 적용하는 곳이 `createRoom()` 하나뿐이고 여기에는 `@Transactional`이 확실히 붙어있다. 처음에 우려했던 문제가 사라진 것이다.

동작 흐름은 이렇다.

```mermaid
sequenceDiagram
    participant C as createRoom()
    participant OR as OutboxEventRecorder
    participant DB as MySQL
    participant AR as AfterCommitRelay
    participant R as Redis Stream
    participant W as Worker (Fallback)

    C->>OR: record(streamKey, event)
    OR->>DB: INSERT outbox_event (PENDING)
    OR-->>C: Spring Event (OutboxSavedEvent)
    C->>DB: saveRoomEntity()
    Note over DB: TX COMMIT

    rect rgb(200, 255, 200)
        Note right of AR: ⚡ Happy Path — 지연 0ms
        AR->>R: streamPublisher.publish()
        alt Redis 정상
            AR->>DB: markPublished() [REQUIRES_NEW]
        else Redis 장애
            Note over AR: 예외 삼킴, PENDING 유지
        end
    end

    rect rgb(255, 220, 200)
        Note right of W: 🔄 Fallback — Redis 장애 시에만 동작
        W->>DB: PENDING 조회 (SKIP LOCKED)
        W->>R: publish()
        W->>DB: markPublished()
    end
```

**평상시:** 트랜잭션 커밋 직후 `AFTER_COMMIT`이 실행되어 Redis에 즉시 발행한다. 지연 0ms.

**Redis 장애 시:** 즉시 발행이 실패하면 예외를 삼킨다. DB에는 이미 PENDING 상태로 Outbox 레코드가 커밋되어 있다. 500ms 후 Worker가 재시도한다.

### OutboxEventRecorder — 저장 + Spring 이벤트 발행

```java
@Component
public class OutboxEventRecorder {

    @Transactional(propagation = Propagation.REQUIRED)
    public void record(StreamKey streamKey, BaseEvent event) {
        final String payload = objectMapper.writeValueAsString(event);
        final OutboxEvent outboxEvent = OutboxEvent.create(streamKey.getRedisKey(), payload);
        outboxEventRepository.saveAndFlush(outboxEvent);

        // Spring 내부 이벤트 → 트랜잭션 커밋 후 AfterCommitRelay가 수신
        applicationEventPublisher.publishEvent(
            new OutboxSavedEvent(outboxEvent.getId(), streamKey.getRedisKey(), payload)
        );
    }
}
```

`saveAndFlush()`를 쓰는 이유가 있다. `save()`만 하면 `GenerationType.IDENTITY`에서 ID 할당이 flush 시점까지 지연될 수 있다. `OutboxSavedEvent`에 `outboxEventId`를 담아야 하므로 즉시 flush해서 ID를 확보한다.

`Propagation.REQUIRED`로 설정한 이유도 있다. `createRoom()`의 `@Transactional`에 참여해서, 비즈니스 데이터(`RoomEntity`)와 Outbox 레코드가 함께 커밋된다. 이게 Outbox 패턴의 핵심 — 단일 트랜잭션 원자성이다.

### OutboxAfterCommitRelay — 커밋 직후 즉시 발행

```java
@Component
public class OutboxAfterCommitRelay {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOutboxSaved(OutboxSavedEvent savedEvent) {
        try {
            final BaseEvent baseEvent = objectMapper.readValue(
                savedEvent.payload(), BaseEvent.class);
            streamPublisher.publish(
                StreamKey.fromRedisKey(savedEvent.streamKey()), baseEvent);

            // REQUIRES_NEW로 새 트랜잭션 강제
            eventProcessor.markPublished(savedEvent.outboxEventId());
        } catch (Exception e) {
            // 실패해도 예외를 삼킨다. PENDING으로 남아있으니 Worker가 재시도
            log.warn("Outbox 즉시 발행 실패: id={}", savedEvent.outboxEventId());
        }
    }
}
```

이 메서드에서 주의해야 할 곳이 두 군데다.

첫 번째는 `try-catch`로 예외를 삼키는 부분이다. `AFTER_COMMIT`에서 예외가 터져도 이미 커밋된 트랜잭션에는 영향이 없지만, 명시적으로 삼켜서 안전하게 실패한다.

두 번째는 `markPublished()`의 트랜잭션 전파 레벨이다. `AFTER_COMMIT` 리스너 내에서는 원래 트랜잭션의 동기화 컨텍스트가 아직 활성 상태다. `Propagation.REQUIRED`로 호출하면 이미 커밋된 트랜잭션에 참여하려 해서 DB 변경이 반영되지 않는다. 처음에 이걸 모르고 `REQUIRED`로 호출했다가 `PUBLISHED`로 전환이 안 되는 버그를 겪었다. `markPublished()`를 `Propagation.REQUIRES_NEW`로 설정해서 강제로 새 트랜잭션을 열어야 한다. Worker에서 호출할 때도 `relay()` 메서드가 `@Transactional` 없이 실행되므로 `REQUIRES_NEW`든 `REQUIRED`든 어차피 새 트랜잭션이 열린다. 기능 차이가 없다.

### createRoom() — 최종 형태

```java
@Transactional
public Room createRoom(String hostName) {
    final Room room = roomCommandService.saveIfAbsentRoom(joinCode, new PlayerName(hostName));
    final BaseEvent event = new RoomCreateEvent(hostName, joinCode.getValue());

    // Outbox 경로: DB 저장과 원자적으로 묶이고, 커밋 직후 즉시 발행 (0ms)
    outboxEventRecorder.record(StreamKey.ROOM_BROADCAST, event);

    saveRoomEntity(joinCode.getValue());
    return room;
}
```

나머지 이벤트 발행 경로(`broadcastReady()`, `enterRoomAsync()`, 미니게임 입력 등)는 `streamPublisher.publish()` 직접 발행을 유지한다. DB 원자성이 필요 없고 실시간성이 핵심인 경로들이다.

## Outbox Relay Worker — 처음 구현에서 삽질한 이야기

### 폴링 간격과 배치 설정값

Worker는 `AFTER_COMMIT` 즉시 발행이 실패한 이벤트만 수거하는 Fallback 역할이다. 평상시에는 PENDING 이벤트가 없다.

폴링 간격 500ms, 배치 50건, 최대 재시도 10회. 500ms는 Redis 장애 복구 후 밀린 이벤트를 빠르게 처리하면서 DB 부하를 최소화하는 균형점이다. PENDING이 없으면 인덱스만 타고 빈 결과를 반환하므로 부하가 거의 없다. 10회(=5초) 연속 실패하면 인프라 장애로 판단해 DEAD_LETTER로 뺀다.

### 처음 구현: @Transactional로 배치 전체를 감쌌다

처음 작성한 Worker 코드는 이랬다.

```java
@Scheduled(fixedDelay = 500)
@Transactional  // 이게 시스템을 죽일 수 있다
public void relay() {
    List<OutboxEvent> pendingEvents = outboxEventRepository
        .findPendingEventsForUpdate(BATCH_SIZE);

    for (OutboxEvent event : pendingEvents) {
        streamPublisher.publish(...);  // Redis I/O
        event.markPublished();
    }
}
```

Redis에 장애가 나서 `publish()`가 타임아웃(1초)까지 블로킹되면, 50개를 순회하는 동안 최대 50초 동안 DB 커넥션 하나를 물고 놓지 않는다. **Redis 장애가 DB 장애로 전파되는 Cascading Failure**가 발생한다.

```mermaid
sequenceDiagram
    participant W as Worker
    participant DB as HikariCP (max 10)
    participant R as Redis (장애)

    W->>DB: getConnection() [1/10]
    W->>DB: SELECT PENDING FOR UPDATE
    loop 50 events
        W->>R: publish() → timeout 1s
        Note over DB: 커넥션 점유 중...
    end
    Note over W: 50초간 커넥션 1개 점유
    Note over DB: 다른 스케줄러/요청도<br/>커넥션 대기 → Pool Exhausted
```

### 해결: 트랜잭션과 Redis I/O를 완전히 분리했다

`relay()` 메서드에서 `@Transactional`을 제거하고, DB 조작을 별도 컴포넌트(`OutboxEventProcessor`)의 개별 트랜잭션 메서드로 분리했다.

```java
@Scheduled(fixedDelay = 500)
public void relay() {
    // 1단계: TX-1 — PENDING → IN_PROGRESS + COMMIT (DB 커넥션 즉시 반환)
    final List<OutboxEvent> events = eventProcessor.fetchAndMarkInProgress(BATCH_SIZE);
    if (events.isEmpty()) return;

    for (final OutboxEvent event : events) {
        try {
            // 2단계: No TX — Redis I/O
            final BaseEvent baseEvent = objectMapper.readValue(event.getPayload(), BaseEvent.class);
            streamPublisher.publish(StreamKey.fromRedisKey(event.getStreamKey()), baseEvent);

            // 3단계: TX-2 — 단건 업데이트
            eventProcessor.markPublished(event.getId());
        } catch (Exception e) {
            eventProcessor.handleFailure(event.getId());
        }
    }
}
```

**같은 클래스 안에 두지 않고 별도 컴포넌트로 분리한 이유**가 있다. Spring AOP의 Self-Invocation 제약 때문이다. 같은 클래스 내에서 `this.fetchAndMarkInProgress()`로 호출하면 프록시를 타지 않아 `@Transactional`이 동작하지 않는다.

### IN_PROGRESS에서 서버가 죽으면?

`IN_PROGRESS` 상태를 도입하면 새로운 엣지 케이스가 생긴다. Worker가 `IN_PROGRESS`로 바꾼 후 Redis 발행 전에 서버가 죽으면, 해당 이벤트는 영원히 `IN_PROGRESS`에 갇힌다.

별도 스케줄러로 복구한다. 1분마다 돌면서 `updatedAt` 기준 5분 이상 `IN_PROGRESS`로 남아있는 이벤트를 `PENDING`으로 되돌린다. 처음에는 `createdAt`으로 판별했는데, 이러면 생성된 지 5분이 지난 이벤트가 방금 `IN_PROGRESS`로 전환되자마자 복구 대상이 되는 문제가 있었다. `updatedAt`을 도입해서 상태 전이 시점 기준으로 판별하도록 수정했다. 이 복구 시 중복 발행이 발생할 수 있지만, 기존에 구축해둔 `@RedisLock` 기반 Consumer 멱등성이 안전하게 흡수한다.

## 동시성 제어 — 다중 인스턴스에서 중복 발행 방어

서버가 2대 이상일 때 각 서버의 Worker가 동시에 같은 PENDING 레코드를 읽으면 Redis에 이벤트가 2번 발행된다.

처음에 Redisson 분산 락을 쓰려고 했다. 하지만 Outbox를 도입하는 이유가 "Redis 장애 대비"인데, 릴레이 동시성 제어를 Redis에 맡기면 순환 의존이다.

MySQL `SELECT ... FOR UPDATE SKIP LOCKED`를 선택했다. 다른 트랜잭션이 락을 잡은 행을 무시하고 다음 행을 가져오므로, 각 서버가 서로 다른 레코드를 처리한다. 데드락 없이, 대기 없이.

```java
@Query(
    value = "SELECT * FROM outbox_event " +
            "WHERE status = 'PENDING' " +
            "ORDER BY id ASC " +
            "LIMIT :size " +
            "FOR UPDATE SKIP LOCKED",
    nativeQuery = true
)
List<OutboxEvent> findPendingEventsForUpdate(@Param("size") int size);
```

## 처리 완료된 레코드 정리

매일 새벽 4시에 24시간 이전의 PUBLISHED 레코드를 삭제한다. 장애 역추적을 위해 24시간 보존 기간을 둔다.

## 결과

### Before

```mermaid
flowchart LR
    A[Controller / Service] -->|직접 호출| B[StreamPublisher]
    B -->|publish| C[Redis Stream]
    B -.->|실패 시| D[이벤트 유실]
```

### After

```mermaid
flowchart TB
    subgraph Outbox_경로
        A1[createRoom] -->|record| B1[OutboxEventRecorder]
        B1 -->|same TX| C1[(MySQL)]
        C1 -->|AFTER_COMMIT 0ms| D1[AfterCommitRelay]
        D1 -->|publish| E1[Redis Stream]
        D1 -.->|실패| F1[PENDING → Worker 재시도]
    end

    subgraph 직접_발행_경로
        A2[WebSocket / 미니게임] -->|publish| E2[Redis Stream]
    end

    E1 --> G[Consumer]
    E2 --> G
    G -->|RedisLock| H[멱등성 보장]
```

- `createRoom()`: DB 원자성 + 즉시 발행(0ms) + Redis 장애 시 자동 재시도
- 나머지: 직접 발행 유지. 실시간 게임에 영향 없음
- Worker 트랜잭션 분리로 Redis 장애 → DB 장애 전파 차단
- `SKIP LOCKED`로 다중 인스턴스 중복 발행 차단
- At-least-once + Consumer 멱등성 = 전체 정합성 보장

## 정리

이번 설계에서 핵심 판단은 다섯 가지였다.

첫째, **이벤트 발행 경로를 분류한 것**이다. 처음에는 모든 이벤트를 Outbox로 돌리려 했다가 기존 테스트가 전멸했다. 전수 조사해서 "DB 원자성이 필요한 경로"와 "실시간성이 핵심인 경로"를 분리했다. `createRoom()`만 Outbox를 적용하고 나머지는 직접 발행을 유지한 것이 이번 설계의 출발점이다.

둘째, **AFTER_COMMIT 즉시 발행 + 폴링 재시도의 2단 구조를 채택한 것**이다. 처음에는 "구현 복잡도" 때문에 폴링 전용을 선택했다가, 500ms 지연이 만드는 문제를 직접 겪었다. `createRoom()`에만 적용하면 `@Transactional` 보장이 확실하므로 처음에 우려했던 문제가 없다. 적용 범위를 좁힌 덕분에 처음에 포기했던 카드를 다시 꺼낼 수 있었다.

셋째, **Relay Worker의 트랜잭션과 Redis I/O를 분리한 것**이다. `@Transactional`로 배치 전체를 감싸는 실수를 했고, Cascading Failure 위험을 발견했다. `IN_PROGRESS` 상태를 도입해서 DB 커넥션 점유를 최소화했다.

넷째, 동시성 제어에 Redis 락이 아닌 MySQL `SKIP LOCKED`를 선택한 것이다. Outbox의 존재 이유가 Redis 장애 대비인데, 릴레이 동시성 제어를 Redis에 맡기면 순환 의존이 된다.

다섯째, **Outbox의 At-least-once 특성을 Consumer의 멱등성으로 보완한 것**이다. 기존에 구축해둔 `@RedisLock` 기반 멱등성 방어 로직이 중복 발행을 안전하게 흡수한다. 새로운 패턴과 기존 인프라가 맞물려서 전체 시스템의 정합성이 완성되는 구조다.
