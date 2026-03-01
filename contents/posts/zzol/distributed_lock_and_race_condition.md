---
title: "분산 락의 함정: 락을 걸었는데도 이벤트가 두 번 처리된 이유"
date: 2026-03-01 11:44:21
updated: 2026-03-02 01:26:57
publish: true
tags:
  - ZZOL
series: ZZOL 개발록
---
ZZOL에서 Redis Stream을 이벤트 버스로 사용하고 있다. 방 생성, 게임 시작, 룰렛 결과 등 거의 모든 도메인 이벤트가 Redis Stream을 통해 흐른다. 그런데 이벤트가 **두 번 이상 도착할 수 있다**는 사실을 인지했고, 이를 해결하기 위한 멱등성 처리를 설계한 과정을 기록한다.

## 문제 인식: 이벤트가 왜 두 번 오는가

처음에는 이벤트 중복을 고민하지 않았다. Redis Stream에 이벤트를 발행하면, 리스너가 읽어서 처리하면 끝이라고 생각했다. 하지만 운영 로그를 보다가 이상한 걸 발견했다.

```
[INFO] 룰렛 결과 DB 저장 완료: eventId=abc-123, joinCode=A1B2
[INFO] 룰렛 결과 DB 저장 완료: eventId=abc-123, joinCode=A1B2
```

같은 `eventId`로 같은 이벤트가 두 번 처리됐다. 당첨자가 DB에 두 행으로 들어갔다.

원인을 추적해보니 `StreamMessageListenerContainer`의 동작 방식 때문이었다. ZZOL은 Consumer Group 없이 `StreamOffset.fromStart()`로 메시지를 읽는 구조다. 이 방식은 Container가 시작될 때마다 Stream의 처음부터 읽는다. Docker HEALTHCHECK에 의한 컨테이너 재시작, Recovery에 의한 Container 재시작, 배포에 의한 재시작 — 이유가 뭐든 Container가 재시작되면 이미 처리한 이벤트를 다시 읽게 된다.

Redis Stream 자체가 at-least-once delivery다. "최소 한 번은 전달하지만 정확히 한 번은 보장하지 않는다."

이게 왜 문제인가. 룰렛 결과 저장 이벤트(`RouletteSpinEvent`)가 두 번 처리되면 같은 당첨자가 DB에 두 번 INSERT된다. 미니게임 결과 저장(`MiniGameFinishedEvent`)이 두 번 처리되면 같은 플레이어의 점수가 두 행으로 들어간다. 대시보드 통계가 틀어지고, 최악의 경우 게임 진행 자체가 꼬인다.

### fromStart()를 쓰면 재시작할 때마다 전체를 다시 읽는 거 아닌가?

이 의문이 당연히 생긴다. Stream에 이벤트가 10,000건 쌓여있으면 재시작할 때마다 10,000건을 다시 읽는 건가?

그렇게 되지 않도록 `StreamPublisher`에서 발행 시 MAXLEN trimming을 걸어뒀다.

```java
stringRedisTemplate.opsForStream().add(
    StreamRecords.newRecord().in(key.getRedisKey()).ofObject(...),
    XAddOptions.maxlen(maxLength).approximateTrimming(true)  // maxLength=100
);
```

`MAXLEN ~ 100`이면 Stream에 100건 이상 쌓이지 않는다. approximate trimming(`~`)이라 정확히 100건은 아니지만, 대략 100건 근처에서 오래된 메시지가 잘린다. 재시작 시 최대 100건만 읽고, 이미 처리된 건 done key 체크로 스킵하는 구조다.

100건으로 잡은 이유는, 모든 스트림(`room`, `room:join`, `cardgame:select`, `minigame`, `racinggame`)의 공통 설정이 `max-length: 100`이기 때문이다. 게임 한 판에서 발생하는 이벤트가 보통 20 ~ 30건이고, 동시에 3 ~ 4개 방이 진행되는 피크 시간을 고려하면 100건이면 최근 이벤트를 충분히 담는다.

다만 이 구조에는 한계가 있다. 멀티 인스턴스로 확장하면 fromStart()는 각 인스턴스가 모든 이벤트를 중복으로 읽게 되므로, 그때는 Consumer Group으로 전환해야 한다. 현재는 단일 인스턴스이고 MAXLEN 100건이라 fromStart()의 실질적 비용이 무시할 수준이라고 판단했다.

## 선택지 분석: 처음에는 DB에서 막으려고 했다

### 첫 번째 시도: DB Unique Constraint

가장 먼저 떠올린 건 DB에서 막는 것이었다. 이벤트 처리 이력을 저장하는 테이블을 하나 만들고, `event_id`에 UNIQUE 제약을 걸어서 중복 INSERT 시 예외를 잡아 무시하는 방식이다.

실제로 `MiniGameResultSaveEventListener`의 코드를 보면 이게 왜 안 되는지 바로 보인다.

```java
public void handle(MiniGameFinishedEvent event) {
    final RoomEntity roomEntity = roomJpaRepository
        .findFirstByJoinCodeOrderByCreatedAtDesc(event.joinCode())
        .orElseThrow(...);
    final MiniGameEntity miniGameEntity = miniGameJpaRepository
        .findByRoomSessionAndMiniGameType(roomEntity, miniGameType)
        .orElseThrow(...);
    // ... 방 조회, 미니게임 조회, 결과 계산 ...
    for (Player player : room.getPlayers()) {
        miniGameResultJpaRepository.save(resultEntity);  // 플레이어 수만큼 INSERT
    }
}
```

이벤트 핸들러가 단순 INSERT 하나가 아니다. 방 조회 → 미니게임 조회 → 플레이어별 결과 생성 → 다건 INSERT라는 복잡한 흐름이다. UNIQUE 제약으로 마지막 INSERT에서 터뜨리면, 그 앞의 조회와 연산이 전부 헛수고다. 그리고 `RoulettePersistenceService.saveRoomStatus()`처럼 INSERT가 아니라 UPDATE인 경우에는 UNIQUE 제약이 아예 적용되지 않는다.

### 두 번째 시도: Consumer Group

Redis Stream의 정석적인 방법이다. Consumer Group을 만들고, 이벤트를 처리한 후 `XACK`를 보내면 같은 이벤트를 다시 받지 않는다. exactly-once에 가장 가까운 구조다.

하지만 Consumer Group을 도입하면 관리해야 할 것들이 생긴다. PEL(Pending Entries List) 모니터링, XCLAIM으로 stuck 메시지 회수, Consumer가 비정상 종료됐을 때 재등록 처리. ZZOL은 단일 인스턴스다. Consumer Group은 "여러 Consumer가 하나의 Stream을 나눠 읽는" 시나리오에 최적화되어 있고, 단일 인스턴스에서는 이 관리 오버헤드가 실익 대비 과하다고 판단했다.

그리고 Consumer Group을 쓰더라도 멱등성 처리가 불필요해지는 건 아니다. `XACK` 전에 앱이 죽으면 같은 메시지가 다시 전달된다. Consumer Group은 중복 전달 빈도를 줄여주지만, 완전히 없애지는 못한다. 결국 "이벤트가 두 번 와도 안전한" 구조는 별도로 필요하다.

### 최종 선택: 분산 락 + 처리 완료 마킹

두 가지 문제를 각각 해결하는 구조를 선택했다.

- **분산 락**: 같은 이벤트가 동시에 두 번 실행되는 것을 방지한다.
- **처리 완료 마킹(done key)**: 이전에 이미 처리된 이벤트를 스킵한다.

선택 이유는 세 가지다.

첫째, 이벤트 핸들러의 로직 변경 없이 적용할 수 있다. AOP로 메서드 진입 전에 중복 체크를 하기 때문에, 비즈니스 로직은 "이벤트가 정확히 한 번만 들어온다"고 가정하고 작성하면 된다.

둘째, INSERT뿐 아니라 UPDATE, 복합 로직에도 동일하게 적용된다. done key 체크가 메서드 레벨에서 일어나기 때문에 내부 로직이 뭐든 상관없다.

셋째, 이미 Redisson이 분산 락 용도로 프로젝트에 들어있었다. 새로운 의존성 추가 없이 구현 가능했다.

## 설계: 어노테이션 각 값을 왜 그렇게 잡았는가

### 어노테이션

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RedisLock {
    String key();                          // SpEL 표현식
    String lockPrefix() default "lock:";
    String donePrefix() default "done:";
    long waitTime() default 0;            // 락 대기 시간 (ms)
    long leaseTime() default 5000;        // 락 유지 시간 (ms)
    long doneTtl() default 600000;        // done key TTL (ms)
}
```

### key: SpEL을 선택한 이유

처음에는 단순히 `String key()`에 고정 문자열을 넣으려고 했다. 그런데 이벤트마다 고유 식별자의 위치가 다르다.

```java
// 이벤트마다 식별자 접근 방식이 다름
RouletteSpinEvent           → event.eventId()
MiniGameFinishedEvent       → event.eventId()
StartMiniGameCommandEvent   → event.eventId()
```

지금은 전부 `eventId()`지만, 나중에 `joinCode + miniGameType` 같은 복합 키가 필요해질 수도 있다. SpEL(Spring Expression Language)을 사용하면 런타임에 메서드 파라미터의 필드를 꺼내서 동적으로 키를 만들 수 있다. `@Cacheable`이나 `@PreAuthorize`에서 `#result`, `#id` 같은 표현식을 쓰는 것과 같은 원리다.
```java
@RedisLock(key = "#event.eventId()")
public void handle(RouletteSpinEvent event) { ... }
```

`#event.eventId()`가 SpEL 파서를 통해 `"abc-123"` 같은 실제 값으로 치환되고, `lockPrefix`와 합쳐져서 `event:lock:abc-123`이 최종 락 키가 된다.

### waitTime=0: 즉시 포기하는 게 맞는가?

Redisson의 `tryLock(waitTime, leaseTime, unit)`에서 `waitTime`은 "락이 이미 잡혀있을 때 최대 얼마나 기다릴 것인가"를 의미한다. 동작을 정리하면 이렇다.

```
tryLock(waitTime=0):
  Redis에 "락 비었어?" 물어봄
    → 비었으면 → 락 획득 → return true
    → 잡혀있으면 → 기다리지 않고 즉시 → return false

tryLock(waitTime=100ms):
  Redis에 "락 비었어?" 물어봄
    → 비었으면 → 락 획득 → return true
    → 잡혀있으면 → 100ms 동안 대기하며 재시도
      → 100ms 안에 풀리면 → 락 획득 → return true
      → 100ms 지나도 안 풀리면 → return false
```

처음에는 `waitTime=100`을 줬었다. "혹시 네트워크 지연으로 tryLock이 실패하면 이벤트가 유실되지 않나?"라는 걱정 때문이었다.

하지만 Redisson의 `tryLock` 동작을 확인해보니 이 걱정이 불필요했다. `waitTime`은 **Redis에 도달한 후 락이 점유됐을 때의 대기 시간**이지, 네트워크 통신 자체의 타임아웃이 아니다. Redis 네트워크 장애나 연결 실패 시에는 false가 아니라 `RedisConnectionException`이나 `RedisTimeoutException` 같은 **예외가 던져진다.** 즉 tryLock의 false는 "정상적으로 Redis에 도달했지만 락이 이미 점유된 상태"를 의미한다.

그래서 false가 나오면 "다른 스레드가 같은 이벤트를 처리 중"이라는 의미이고, 기다릴 필요 없이 바로 포기하는 게 맞다. 어차피 처리가 끝나면 done key가 마킹되고, 나중에 같은 이벤트가 다시 오면 done key에서 걸러진다.

다만 `waitTime`과 별개로, tryLock 내부에서 Redis에 명령을 보내고 응답을 기다리는 과정에서 Redisson의 `timeout` 설정만큼 블로킹될 수 있다. Redis가 정상이면 이 구간이 1~5ms지만, Redis가 느려지면(Slowlog 발생, 메모리 부족 등) `timeout` 설정값만큼 스레드가 잡혀있게 된다. Redisson의 기본 `timeout`이 3초이므로, 이를 1초로 튜닝하여 빠른 실패(fail-fast)를 유도했다.

waitTime을 0이 아닌 값으로 두면 어떻게 되는가? 스레드가 락 대기 큐에 걸린다. Redis Stream 리스너 스레드풀이 점유되면서, 다른 이벤트의 처리가 밀린다. 특히 `room:join` 스트림처럼 단일 스레드(core=1, max=1)로 운영하는 경우, 하나의 이벤트가 락 대기로 100ms를 잡아먹으면 그 뒤의 입장 이벤트가 전부 밀린다.

### leaseTime=5000ms: 왜 5초인가

락이 자동 해제되는 시간이다. 이벤트 핸들러가 비정상 종료(OOM, 스레드 인터럽트 등)해서 `finally`의 `unlock()`이 실행되지 않는 경우를 대비한다.

선택지는 세 가지였다.

```
leaseTime=1000ms  → 핸들러가 1초 안에 끝나야 함. DB 쿼리 지연 시 락이 먼저 풀림 → 중복 처리 위험
leaseTime=5000ms  → 실제 실행 시간(~100ms)의 50배. 충분한 안전 마진 + 비정상 시 5초 후 회복
leaseTime=30000ms → 비정상 종료 후 30초간 해당 이벤트 처리 불가. 과도한 대기
```

5초를 선택했다. 실제 핸들러 실행 시간이 대부분 100ms 이내이므로 안전 마진이 충분하고, 비정상 종료 시에도 5초면 다음 시도가 가능하다.

### doneTtl=600000ms (10분): 왜 10분인가

done key가 Redis에 유지되는 시간이다. 이 시간이 지나면 done key가 사라지고, 같은 이벤트가 다시 처리될 수 있다.

ZZOL의 게임 생명주기를 기준으로 잡았다. 방 하나가 생성되고 게임이 끝나기까지 길어야 10~15분이다. 게임이 끝난 뒤에 같은 이벤트가 다시 도착하는 건 현실적으로 불가능하다. 10분이면 게임이 진행 중인 동안 중복을 완벽히 막으면서, 게임이 끝난 후에는 Redis 메모리를 자연스럽게 회수한다.

1시간, 24시간으로 잡으면 더 안전하지만 Redis 메모리를 점유한다. ZZOL은 EC2 t4g.medium에서 Redis를 운영하고 있고, 메모리가 넉넉하지 않다. done key 하나당 수십 바이트지만, 이벤트가 매 게임마다 수십 건씩 발생하면 누적된다.

done key의 키 구조는 `{donePrefix}{eventId}` 형태의 일반 String이다. `opsForValue().set(key, "done", Duration)`으로 개별 TTL을 설정한다. Hash(HSET)도 고려했지만, Redis에서 Hash 필드 단위 TTL 설정이 기본적으로 지원되지 않기 때문에(Redis 7.4 이전) 이벤트별 개별 만료가 불가능했다. String SET이 이 용도에 더 적합했다.

## AOP 구현: 더블 체크가 필요한 이유

### 처음 구현 (버그 있음)

처음에는 이렇게 구현했다.

```java
// 1단계: done key 확인
if (isAlreadyProcessed(doneKey)) return null;

// 2단계: 락 획득
if (!lock.tryLock(...)) return null;

// 3단계: 비즈니스 로직
Object result = joinPoint.proceed();

// 4단계: done 마킹
markAsDone(doneKey, doneTtl);
```

"done key 확인 → 락 획득 → 실행 → done 마킹" 순서면 충분하다고 생각했다. 하지만 이 코드에는 Race Condition이 있다.

```
Thread A: isAlreadyProcessed → false (통과)
Thread B: isAlreadyProcessed → false (통과)  ← A가 아직 done 마킹 안 함
Thread A: tryLock → 성공 → 비즈니스 로직 실행 → done 마킹 → unlock
Thread B: tryLock → 성공 (A가 이미 풀었으니까!) → 비즈니스 로직 실행 → 중복!
```

`waitTime=0`이라서 B가 바로 튕겨 나갈 것 같지만, 문제는 **시간차**다. A가 락을 풀고 난 직후에 B가 tryLock을 시도하면, 락이 비어있으니 B가 정상적으로 잡는다. B는 첫 번째 done key 체크를 이미 통과한 상태이므로, A가 마킹한 done key를 모른 채 비즈니스 로직을 실행한다.

### 더블 체크로 Race Condition을 막는 흐름

아래 다이어그램에서 첫 번째가 싱글 체크(버그), 두 번째가 더블 체크(수정)다.


```

[Single Check — Race Condition]

  Thread A                  Redis                    Thread B
     |                        |                         |
     |--- GET done:abc ------>|                         |
     |<-- nil ----------------|                         |
     |                        |                         |
     |--- LOCK lock:abc ----->|                         |
     |<-- OK (acquired) ------|                         |
     |                        |<----- GET done:abc -----|
     |  execute handler       |------ nil ------------->|  ← not yet marked
     |                        |                         |
     |--- SET done:abc ------>|                         |
     |--- UNLOCK lock:abc --->|                         |
     |                        |<----- LOCK lock:abc ----|
     |                        |------ OK (acquired!) -->|  ← lock was released
     |                        |                         |
     |                        |     execute handler     |  ← DUPLICATE!
     |                        |                         |


[Double Check — Race Condition Blocked]

  Thread A                  Redis                    Thread B
     |                        |                         |
     |--- GET done:abc ------>|                         |
     |<-- nil ----------------|                         |
     |                        |                         |
     |--- LOCK lock:abc ----->|                         |
     |<-- OK (acquired) ------|                         |
     |                        |<----- GET done:abc -----|
     |  execute handler       |------ nil ------------->|  ← same so far
     |                        |                         |
     |--- SET done:abc ------>|                         |
     |--- UNLOCK lock:abc --->|                         |
     |                        |<----- LOCK lock:abc ----|
     |                        |------ OK (acquired!) -->|
     |                        |                         |
     |                        |<----- GET done:abc -----|  ← 2nd check!
     |                        |------ "done" ---------->|
     |                        |                         |
     |                        |       return null       |  ← blocked
     |                        |<----- UNLOCK lock:abc --|
```

핵심은 Thread B가 락을 잡은 직후에 done key를 **한 번 더 확인**하는 것이다. Thread A가 이미 done을 마킹해뒀기 때문에, B는 비즈니스 로직에 진입하지 않고 빠진다.

### 수정된 구현 (더블 체크)

락을 획득한 직후에 done key를 한 번 더 확인해야 한다.

```java
@Around("@annotation(coffeeshout.global.lock.RedisLock)")
public Object lock(ProceedingJoinPoint joinPoint) throws Throwable {
    final MethodSignature signature = (MethodSignature) joinPoint.getSignature();
    final Method method = signature.getMethod();
    final RedisLock redisLock = method.getAnnotation(RedisLock.class);

    final String lockKey = getLockKey(joinPoint, redisLock);
    final String doneKey = getDoneKey(joinPoint, redisLock);

    // 1단계: 락 획득 전 빠른 체크 (성능 최적화)
    if (isAlreadyProcessed(doneKey)) {
        log.debug("이미 처리된 이벤트 (스킵): doneKey={}", doneKey);
        return null;
    }

    final RLock lock = redissonClient.getLock(lockKey);

    try {
        final boolean acquired = lock.tryLock(
                redisLock.waitTime(),
                redisLock.leaseTime(),
                TimeUnit.MILLISECONDS
        );

        if (!acquired) {
            log.warn("락 획득 실패 (스킵): lockKey={}", lockKey);
            return null;
        }

        // 2단계: 락 획득 후 이중 체크 (Race Condition 방지)
        if (isAlreadyProcessed(doneKey)) {
            log.debug("락 획득 후 이중 체크 - 이미 처리됨 (스킵): doneKey={}", doneKey);
            return null;
        }

        // 3단계: 비즈니스 로직 실행
        final Object result = joinPoint.proceed();

        // 4단계: 처리 완료 마킹
        markAsDone(doneKey, redisLock.doneTtl());

        return result;

    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new RuntimeException("락 획득 중 인터럽트 발생", e);
    } finally {
        if (lock.isHeldByCurrentThread()) {
            lock.unlock();
        }
    }
}
```

1단계의 done key 체크는 **성능 최적화**다. 이미 처리된 이벤트는 락을 잡을 필요도 없이 `EXISTS` 하나로 스킵한다. 재시작 후 Stream을 처음부터 읽을 때, 이미 처리된 수십 건의 이벤트가 전부 락 획득을 시도하면 Redisson에 불필요한 부하가 걸린다.

2단계의 done key 체크가 **정합성 보장**이다. 락을 잡은 상태에서 다시 확인하므로, 1단계를 통과한 뒤 다른 스레드가 먼저 처리한 경우를 잡아낸다. Java의 Double-checked locking 패턴과 동일한 구조다.

`lock.isHeldByCurrentThread()` 체크가 있는 이유는, leaseTime이 만료되어 락이 자동 해제된 상태에서 `unlock()`을 호출하면 `IllegalMonitorStateException`이 발생하기 때문이다.

## @Order(HIGHEST_PRECEDENCE): 트랜잭션보다 먼저 실행해야 하는 이유

이벤트 핸들러에 `@Transactional`이 함께 붙어있는 경우가 있다.

```java
@EventListener
@Transactional
@RedisLock(key = "#event.eventId()", ...)
public void handle(MiniGameFinishedEvent event) { ... }
```

처음에는 `@Order`를 신경 쓰지 않았다. 동작은 했으니까. 하지만 중복 이벤트가 들어올 때 DB 커넥션 풀 모니터링에서 이상한 게 보였다. 중복 이벤트가 들어올 때마다 active connection이 순간적으로 올라갔다.

원인은 AOP 실행 순서였다. `@Transactional`이 `@RedisLock`보다 먼저 실행되면 이런 일이 벌어진다.

```
@Transactional이 바깥인 경우:

  Transaction begin        ← DB 커넥션 획득
      |
      v
  RedisLock (done key 체크)
      |
      +-- 이미 처리됨 → return null
                          ← 아무 쿼리도 안 날렸지만 커넥션은 이미 잡혀있었음
```

done key 체크로 스킵하더라도 이미 DB 커넥션을 잡은 상태다. 중복 이벤트가 올 때마다 쓸모없는 커넥션이 소비된다. 재시작 후 Stream의 100건을 다시 읽을 때, 이미 처리된 90건이 전부 DB 커넥션을 잡았다가 놓는 것이다.

```java
@Order(Ordered.HIGHEST_PRECEDENCE)  // 트랜잭션(@Order 기본값 LOWEST)보다 먼저 실행
public class RedisLockAspect { ... }
```

`HIGHEST_PRECEDENCE`로 두면 RedisLock이 가장 먼저 실행된다. 중복 이벤트는 트랜잭션이 열리기 전에 걸러지므로 DB 커넥션 낭비가 없다.

## 적용

실제로 `@RedisLock`을 적용한 곳은 세 군데다.

**1. 미니게임 결과 저장** — 가장 먼저 문제가 발견된 곳

```java
@EventListener
@Transactional
@RedisLock(
    key = "#event.eventId()",
    lockPrefix = "minigame:result:lock:",
    donePrefix = "minigame:result:done:"
)
public void handle(MiniGameFinishedEvent event) {
    // 방 조회 → 미니게임 조회 → 플레이어별 결과 INSERT
}
```

미니게임이 끝나면 모든 플레이어의 점수와 순위를 DB에 저장한다. 플레이어가 4명이면 4건의 INSERT가 발생한다. 이 이벤트가 중복 처리되면 같은 플레이어의 결과가 두 행씩 들어간다. prefix를 `minigame:result:`로 구분한 건, 다른 도메인의 done key와 키가 충돌하지 않도록 네임스페이스를 분리하기 위해서다.

**2. 룰렛 상태 저장 + 결과 저장**

```java
@RedisLock(key = "#event.eventId()", lockPrefix = "event:lock:", donePrefix = "event:done:")
public void saveRoomStatus(RouletteShowEvent event) {
    rouletteService.updateRoomStatusToRoulette(event.joinCode());
}

@RedisLock(key = "#event.eventId()", lockPrefix = "event:lock:", donePrefix = "event:done:")
public void saveRouletteResult(RouletteSpinEvent event) {
    rouletteService.saveRouletteResult(event.joinCode(), event.winner());
}
```

룰렛 관련 이벤트는 두 개다. `RouletteShowEvent`는 방 상태를 `ROULETTE`로 UPDATE하고, `RouletteSpinEvent`는 당첨자를 INSERT한다. 특히 `saveRouletteResult`가 두 번 실행되면 같은 당첨자가 두 번 저장되는데, 이게 맨 처음 로그에서 발견한 문제였다.

**3. 미니게임 시작 시 엔티티 생성**

```java
@RedisLock(key = "#event.eventId()", lockPrefix = "event:lock:", donePrefix = "event:done:")
@Transactional
public void saveGameEntities(StartMiniGameCommandEvent event, MiniGameType miniGameType) {
    // 방 상태 UPDATE → 미니게임 엔티티 INSERT → (첫 게임이면) 플레이어 엔티티 INSERT
}
```

게임 시작 시 방 상태를 `PLAYING`으로 변경하고, 미니게임과 플레이어 엔티티를 생성한다. 첫 게임 시작인 경우에만 플레이어 엔티티를 INSERT하는 조건 분기(`room.isFirstStarted()`)가 있는데, 이벤트가 두 번 처리되면 두 번 다 `true`를 반환해서 플레이어가 중복 생성된다.

## eventId 생성: UUID vs Stream Entry ID

`@RedisLock`의 키로 사용되는 `eventId`는 이벤트 생성 시점에 UUID로 만든다.

```java
public record RouletteSpinEvent(
    String eventId,
    Instant timestamp,
    String joinCode,
    // ...
) implements BaseEvent {

    public RouletteSpinEvent(String joinCode, String hostName, Winner winner) {
        this(
            UUID.randomUUID().toString(),  // Publisher가 생성
            Instant.now(),
            joinCode,
            // ...
        );
    }
}
```

UUID 대신 Redis Stream의 Entry ID(`1234567890-0` 형태)를 사용하는 방안도 고려했다. Entry ID는 Redis가 자동 생성하므로 고유성이 보장된다. 하지만 Entry ID는 `XADD`의 **반환값**이다. 이벤트 객체를 생성하는 시점에는 아직 `XADD`를 호출하기 전이므로, 이벤트 record 안에 Entry ID를 담을 수 없다. `XADD` 후에 반환된 Entry ID를 다시 이벤트에 넣으려면 이벤트가 불변 객체(record)인 구조를 깨야 한다. `eventId`를 Publisher가 이벤트 생성 시점에 만들어야 "같은 이벤트를 식별한다"는 의미론이 명확하다.

이벤트가 Redis Stream에 발행될 때 `eventId`가 JSON에 포함되고, Consumer가 읽을 때 역직렬화되면서 같은 `eventId`가 복원된다. 같은 메시지를 두 번 읽어도 `eventId`는 동일하므로, done key 체크에서 두 번째를 걸러낸다.

## 정리

Redis Stream의 at-least-once delivery 특성에서 중복 처리를 방지하기 위해, 분산 락과 done key를 조합한 AOP 기반 멱등성 보장 구조를 설계했다.

핵심 판단을 정리하면 이렇다.

첫째, 더블 체크가 필수다. 락 획득 전의 done key 체크는 성능 최적화이고, 락 획득 후의 done key 체크가 정합성 보장이다. 둘 중 하나만 있으면 Race Condition이 발생하거나 불필요한 락 획득 비용이 생긴다.

둘째, `waitTime=0`으로 락 대기를 하지 않는다. Redisson의 tryLock은 네트워크 에러 시 false가 아니라 예외를 던진다. false는 "다른 스레드가 처리 중"이라는 의미이므로 기다릴 필요 없이 바로 포기한다. 다만 tryLock 내부의 Redis 명령 자체가 Redisson timeout 설정만큼 블로킹될 수 있으므로, timeout을 1초로 튜닝하여 fail-fast를 유도했다.

셋째, `@Order(HIGHEST_PRECEDENCE)`로 `@Transactional`보다 먼저 실행한다. 중복 이벤트를 DB 커넥션을 잡기 전에 걸러내서, 커넥션 낭비를 방지한다.

넷째, fromStart()의 한계를 MAXLEN으로 보완한다. Stream에 100건 이상 쌓이지 않도록 trimming하고, 재시작 시 최대 100건만 읽는다. 멀티 인스턴스 전환 시에는 Consumer Group으로의 마이그레이션이 필요하다.