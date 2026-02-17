---
title: WebSocket 서비스에서 Graceful Shutdown이 필요한 이유와 구현
date: 2025-12-29 11:54:21
updated: 2026-02-18 03:39:27
publish: true
tags:
  - ZZOL
series: ZZOL 개발록
---
ZZOL 서비스에 Graceful Shutdown을 구현했다. 단순히 "서버를 안전하게 끄자"가 아니라, WebSocket 기반 실시간 게임 서비스에서 "게임 중인 유저의 세션을 어떻게 보호할 것인가"에 대한 이야기다. OS의 SIGTERM 시그널부터 Spring의 SmartLifecycle, 그리고 WebSocket 세션 드레이닝까지의 전체 과정을 기록한다.

## 왜 Graceful Shutdown이 필요한가

ZZOL은 실시간 멀티플레이어 게임 서비스다. 여러 명이 WebSocket으로 연결된 상태에서 미니게임을 하고, 결과에 따라 룰렛으로 당첨자를 뽑는다. 핵심은 **모든 게임 진행이 WebSocket 연결에 의존한다**는 것이다.

서버를 재시작하면 어떤 일이 벌어지는가? 일반적인 HTTP API 서버라면 요청-응답 사이클이 짧아서, 처리 중인 요청만 마무리하면 된다. 하지만 WebSocket 서비스는 다르다. 클라이언트와 서버 사이에 지속적인 연결이 유지되고 있고, 이 연결 위에서 게임 상태가 실시간으로 동기화된다.

서버를 즉시 종료(kill -9)하면 이런 일이 발생한다.

```
Before Graceful Shutdown (kill -9)
===========================================

  Player A --WebSocket--> [Server]
  Player B --WebSocket-->    |     <-- racing game in progress
  Player C --WebSocket-->    |
                             |
                          kill -9
                             |
                             v
  Player A --WebSocket--X  DEAD
  Player B --WebSocket--X   (all connections lost)
  Player C --WebSocket--X   (game state lost)

  Result: Game interrupted, players see error
```

5명이 레이싱 게임을 하고 있는데 서버가 갑자기 죽으면, 5명 전원의 WebSocket 연결이 끊기고 게임 상태가 유실된다. 클라이언트는 아무 예고 없이 연결이 끊겼다는 에러만 받는다. ZZOL에서 레이싱 게임 한 라운드는 약 30초다. 배포 타이밍이 게임 중에 걸리면, 고작 30초를 못 기다려서 진행 중이던 게임 전체가 날아가는 셈이다.

배포는 정기적으로 일어난다. 기능 추가, 버그 수정 때마다 서버를 재시작해야 한다. 그때마다 게임 중인 유저가 피해를 보면 안 된다.

Graceful Shutdown이 해결해야 하는 문제는 세 가지다.

첫째, **진행 중인 게임이 끝날 때까지 기다려야 한다.** 서버가 종료 시그널을 받더라도, 활성 WebSocket 세션이 모두 정리될 때까지 프로세스를 유지해야 한다.

둘째, **종료 중에 새로운 연결을 받으면 안 된다.** Graceful Shutdown이 시작된 후에 새 플레이어가 접속하면, 그 플레이어의 게임이 시작되고 또 끝나길 기다려야 한다. 기존 연결만 드레이닝하고, 신규 연결은 차단해야 종료 시점이 예측 가능해진다.

셋째, **무한정 기다릴 수는 없다.** 클라이언트가 연결을 끊지 않거나, 예상치 못한 상황이 발생할 수 있다. 타임아웃이 필요하다.

## 종료 시그널부터 프로세스 종료까지: 전체 흐름

Graceful Shutdown의 전체 과정을 이해하려면, OS 레벨부터 Spring 레벨까지 어떤 일이 순서대로 일어나는지 알아야 한다.

### 1단계: OS → JVM (SIGTERM)

배포 시 서버를 종료하면, 운영체제는 프로세스에 **SIGTERM(15)** 시그널을 보낸다. `docker stop`, `kill`, AWS CodeDeploy의 종료 명령 등이 모두 SIGTERM을 사용한다.

```
OS sends SIGTERM (signal 15) to JVM process
    |
    v
JVM catches SIGTERM via shutdown hook
    |
    v
JVM begins shutdown sequence
```

SIGTERM은 "종료해달라"는 요청이지 강제 종료가 아니다. 프로세스가 시그널을 받고 정리 작업을 수행할 시간을 준다. 반면 SIGKILL(9)은 프로세스가 핸들링할 수 없는 강제 종료다. `kill -9`를 쓰면 JVM이 아무것도 정리하지 못하고 즉시 죽는다.

JVM은 SIGTERM을 받으면 등록된 **Shutdown Hook**을 실행한다. Spring Boot는 이 Shutdown Hook에 자신의 종료 로직을 등록해놓는다.

### 2단계: JVM → Spring (ApplicationContext 종료)

JVM의 Shutdown Hook이 실행되면 Spring의 `ApplicationContext`가 종료 절차를 시작한다.

```
JVM Shutdown Hook triggered
    |
    v
Spring ApplicationContext.close()
    |
    v
SmartLifecycle beans stop (ordered by phase, highest first)
    |
    +-- Phase MAX_VALUE (highest = stops first)
    |     |
    |     v
    |   WebSocketGracefulShutdownHandler.stop()
    |     -> set shuttingDown = true
    |     -> reject new WebSocket connections
    |     -> wait for active sessions to drain
    |     -> timeout after 5 minutes
    |
    +-- Phase 0 (default)
    |     |
    |     v
    |   Tomcat connector paused
    |     -> stop accepting new HTTP requests
    |     -> wait for in-flight requests
    |
    +-- Bean destruction
          |
          v
        ThreadPoolTaskExecutor.shutdown()
        ThreadPoolTaskScheduler.shutdown()
        DataSource connections closed
        Redis connections closed
```

여기서 핵심은 **SmartLifecycle의 phase 값**이다. phase가 클수록 먼저 stop()이 호출된다. `WebSocketGracefulShutdownHandler`의 phase를 `Integer.MAX_VALUE`로 설정한 이유는, WebSocket 세션 드레이닝이 **가장 먼저** 시작되어야 하기 때문이다.

왜 먼저여야 하는가? WebSocket 세션을 정리하는 과정에서 Redis에 접근해서 방 상태를 업데이트하고, DB에 게임 결과를 저장해야 할 수 있다. 만약 Redis 커넥션이나 DB 커넥션이 먼저 끊기면, 세션 정리 과정에서 예외가 발생한다. 그래서 WebSocket 드레이닝을 먼저 시작하고, 모든 세션이 정리된 뒤에 인프라 리소스를 닫는 순서가 되어야 한다.

### 3단계: Spring → WebSocket (세션 드레이닝)

Spring의 Graceful Shutdown 설정(`server.shutdown: graceful`)은 Tomcat의 HTTP 요청 처리를 대상으로 한다. **WebSocket 연결은 이 메커니즘의 대상이 아니다.** HTTP 요청은 요청-응답 사이클이 끝나면 처리가 완료되지만, WebSocket은 연결이 지속되기 때문이다.

그래서 WebSocket 세션 드레이닝은 직접 구현해야 했다.

```
WebSocketGracefulShutdownHandler.stop()
    |
    v
Check active WebSocket sessions
    |
    +-- sessions == 0
    |     -> shutdown immediately
    |
    +-- sessions > 0
          |
          v
        Set shuttingDown = true
          |
          +-- ShutdownAwareHandshakeInterceptor
          |     rejects new WebSocket handshakes
          |
          v
        Schedule status check (every 5s)
          |
          v
        Wait on CompletableFuture
          |
          +-- All sessions closed naturally
          |     -> complete future -> shutdown done
          |
          +-- Timeout (5 minutes)
                -> log warning with remaining count
                -> force shutdown
```

## 구현 상세

### 신규 연결 차단: ShutdownAwareHandshakeInterceptor

Graceful Shutdown이 시작되면 새로운 WebSocket 연결을 받으면 안 된다. STOMP 엔드포인트(`/ws`)에 `HandshakeInterceptor`를 등록해서, 모든 WebSocket 핸드셰이크 직전에 서버의 종료 상태를 확인하도록 했다. `isShuttingDown`이 true이면 핸드셰이크를 거부하고, 클라이언트는 연결 오류를 받는다. ZZOL은 SockJS를 사용하고 있기 때문에, 클라이언트는 자동으로 재연결을 시도한다. 이때 로드밸런서가 다른 인스턴스(혹은 새로 뜬 인스턴스)로 라우팅하면 된다.

### 세션 드레이닝: WebSocketGracefulShutdownHandler

핵심 구현체인 `WebSocketGracefulShutdownHandler`는 `SmartLifecycle`을 구현한다.

```java
@Override
public void stop(@NonNull Runnable callback) {
    if (isShuttingDown) {
        callback.run();
        return;
    }

    final int currentConnections = getWebSocketSessionCount();

    // 활성 연결이 없으면 즉시 종료
    if (currentConnections == 0) {
        isRunning = false;
        callback.run();
        return;
    }

    // Shutdown 모드 활성화 → 이 시점부터 신규 연결 차단됨
    isShuttingDown = true;
    shutdownFuture.set(new CompletableFuture<>());

    // 5초 간격으로 남은 세션 수 확인
    scheduleStatusLogging();

    // 타임아웃과 함께 대기
    try {
        final CompletableFuture<Void> future = shutdownFuture.get();
        if (future != null) {
            future.get(shutdownWaitDuration.toMillis(), TimeUnit.MILLISECONDS);
        }
    } catch (TimeoutException e) {
        log.warn("Graceful Shutdown 타임아웃: 활성 연결 {} 개가 남아있습니다.",
                getWebSocketSessionCount());
    } finally {
        cleanup();
        callback.run();
    }
}
```

`SmartLifecycle.stop(Runnable callback)`에서 `callback.run()`을 호출해야 Spring이 다음 종료 단계로 진행한다. 이 콜백을 호출하지 않으면 Spring의 종료 프로세스 전체가 멈춘다.

`CompletableFuture`를 사용한 이유가 있다. 폴링(Thread.sleep + 루프)으로 구현할 수도 있지만, CompletableFuture를 사용하면 세션이 모두 종료된 시점에 **즉시** shutdown을 완료할 수 있다. 예를 들어 타임아웃이 5분이더라도, 게임이 1분 만에 끝나서 모든 클라이언트가 나가면 4분을 낭비하지 않고 바로 종료된다. 5초마다 실행되는 상태 체크 스케줄러가 `remaining == 0`을 감지하면 `future.complete(null)`을 호출해서 대기를 해제한다.

## 설정값과 도메인 기반 근거

### shutdown 타임아웃: 5분

```yaml
spring:
  lifecycle:
    timeout-per-shutdown-phase: 5m
```

ZZOL의 게임 흐름은 이렇다. 방에 입장한 참여자들이 미니게임을 하고, 결과에 따라 룰렛을 돌린다. 현재 구현된 미니게임은 레이싱 게임과 카드 게임이 있고, 레이싱 게임 한 라운드가 약 30초다. 라운드는 반복되지 않으며, 현재 구현된 모든 게임을 처음부터 끝까지 다 즐겨도 5분 이내에 끝난다.

따라서 5분이면 **어떤 시점에 종료 시그널이 오더라도, 진행 중인 모든 게임이 자연스럽게 끝나기에 충분한 시간**이다. 이 값을 너무 짧게 잡으면 게임 중에 강제 종료되고, 너무 길게 잡으면 배포가 지연된다. 5분은 "최악의 경우(모든 게임을 다 하는 중)"에도 커버되는 상한선이다.

### 상태 체크 간격: 5초

```java
private static final Duration STATUS_CHECK_INTERVAL = Duration.ofSeconds(5);
```

세션 드레이닝 중에 남은 연결 수를 확인하는 주기다. 5초인 이유는, ZZOL의 WebSocket 하트비트가 4초 간격이기 때문이다.

```java
config.enableSimpleBroker("/topic/", "/queue/")
        .setHeartbeatValue(new long[]{4000, 4000})
```

하트비트 간격보다 짧게 체크하면, 하트비트 타임아웃으로 끊기는 세션을 감지하기 전에 불필요한 체크가 반복된다. 하트비트 간격(4초)보다 약간 길게(5초) 잡으면, 하트비트 한 주기가 지난 뒤에 세션 상태가 갱신된 것을 확인할 수 있다.

### 게임 스케줄러 awaitTermination: 30초

```java
// RacingGameSchedulerConfig.java
scheduler.setWaitForTasksToCompleteOnShutdown(true);
scheduler.setAwaitTerminationSeconds(30);
```

`setWaitForTasksToCompleteOnShutdown(true)`는 스케줄러 종료 시 `ExecutorService.shutdown()`을 호출한다. 대기 중인 작업이 완료될 때까지 기다린다. `false`면 `shutdownNow()`가 호출되어 실행 중인 작업까지 즉시 중단시킨다.

30초로 잡은 이유는, 레이싱 게임 한 라운드가 약 30초이기 때문이다. 게임 스케줄러는 라운드 진행 중에 일정 간격으로 게임 상태를 업데이트하는 작업을 실행한다. 현재 라운드가 끝날 때까지 기다려주려면 최소 30초가 필요하다. Graceful Shutdown의 5분 타임아웃 안에서 동작하므로, 30초 대기는 전체 종료 시간에 큰 영향을 주지 않는다.

### Redis Stream 스레드풀 awaitTermination: 10초

```java
// RedisStreamThreadPoolConfig.java
executor.setWaitForTasksToCompleteOnShutdown(true);
executor.setAwaitTerminationSeconds(10);
```

Redis Stream 이벤트 리스너는 방 참여, 게임 시작 같은 이벤트를 처리한다. 이 작업들은 단건 처리이고, 개별 이벤트의 처리 시간은 수십 ms 수준이다. 10초면 대기 중인 이벤트를 모두 처리하기에 충분하다.

게임 스케줄러(30초)보다 짧은 이유는 작업의 성격이 다르기 때문이다. 게임 스케줄러는 "진행 중인 라운드가 끝날 때까지" 기다려야 하지만, Redis Stream 이벤트는 큐에 쌓인 이벤트를 순서대로 소비하기만 하면 되므로 훨씬 빠르게 정리된다.

### 지연 삭제 스케줄러 awaitTermination: 30초

```java
// DelayRemovalSchedulerConfig.java
scheduler.setWaitForTasksToCompleteOnShutdown(true);
scheduler.setAwaitTerminationSeconds(30);
```

지연 삭제 스케줄러는 플레이어가 WebSocket 연결이 끊겼을 때, 즉시 방에서 제거하지 않고 **15초 후에 제거하는 작업**을 스케줄링한다. 일시적인 네트워크 끊김인 경우 재연결할 시간을 주기 위해서다.

30초로 잡은 이유는, 지연 삭제 대기 시간이 15초이기 때문이다. Graceful Shutdown 시점에 이미 스케줄링된 지연 삭제 작업이 있을 수 있다. 최대 15초 후에 실행되는 작업 + 실행 시간을 고려하면 30초면 충분하다.

## 전체 종료 시퀀스

OS부터 프로세스 종료까지 전체 시퀀스를 정리하면 이렇다.

```
[OS]  docker stop / kill / CodeDeploy stop
  |
  v
[OS]  SIGTERM (signal 15) --> JVM process
  |
  v
[JVM] Shutdown Hook triggered
  |
  v
[Spring] ApplicationContext.close()
  |
  v
[Spring] SmartLifecycle.stop() -- phase MAX_VALUE first
  |
  +--[WebSocket] GracefulShutdownHandler.stop()
  |    |
  |    +-- shuttingDown = true
  |    |   (HandshakeInterceptor rejects new connections)
  |    |
  |    +-- Wait for active sessions to drain
  |    |   (check every 5s, timeout 5min)
  |    |
  |    +-- All sessions closed OR timeout reached
  |         |
  |         v
  |       callback.run() --> Spring continues
  |
  v
[Spring] Tomcat connector paused
  |       (stop accepting new HTTP requests)
  |       (wait for in-flight requests)
  |
  v
[Spring] Bean destruction phase
  |
  +-- Game scheduler shutdown (await 30s)
  |     -> wait for current racing round to finish
  |
  +-- Delay removal scheduler shutdown (await 30s)
  |     -> wait for pending player removals
  |
  +-- Redis Stream thread pool shutdown (await 10s)
  |     -> drain queued events
  |
  +-- DataSource.close()
  +-- RedisConnectionFactory.close()
  |
  v
[JVM] All shutdown hooks completed
  |
  v
[OS] Process exits (exit code 0)
```

SIGTERM → JVM Shutdown Hook → Spring ApplicationContext.close() → SmartLifecycle(phase 순서) → Bean destruction → 프로세스 종료. 이 체인에서 WebSocket 세션 드레이닝은 가장 앞단(phase MAX_VALUE)에서 시작되고, 인프라 리소스 정리(Redis, DB)는 가장 뒷단에서 이뤄진다.

## 핵심 포인트

- **WebSocket은 Spring의 `server.shutdown: graceful` 대상이 아니다.** 이 설정은 Tomcat의 HTTP 요청만 처리한다. WebSocket 세션 드레이닝은 SmartLifecycle을 구현해서 직접 처리해야 한다.
- **SmartLifecycle의 phase를 MAX_VALUE로 설정하면, 가장 먼저 stop()이 호출된다.** WebSocket 세션 정리가 Redis, DB보다 먼저 시작되어야, 정리 과정에서 데이터에 접근할 수 있다.
- **종료 중 신규 연결 차단은 HandshakeInterceptor에서 처리한다.** `isShuttingDown` 플래그를 확인하고 `return false`로 핸드셰이크를 거부하면 된다. 이게 없으면 종료가 무한정 지연될 수 있다.
- **타임아웃은 도메인의 최대 게임 시간을 기준으로 설정한다.** ZZOL의 모든 게임이 5분 이내에 끝나므로, shutdown 타임아웃도 5분이다. 근거 없는 타임아웃은 짧으면 게임을 끊고, 길면 배포를 지연시킨다.
- **SIGTERM과 SIGKILL의 차이를 이해해야 한다.** SIGTERM은 프로세스가 핸들링할 수 있는 종료 요청이고, SIGKILL은 불가능하다. Graceful Shutdown은 SIGTERM에서만 작동한다. `kill -9`를 쓰면 전부 무의미해진다.