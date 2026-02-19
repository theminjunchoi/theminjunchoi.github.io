---
title: "HealthIndicator에는 무엇을 담아야 하는가: 상태 판별부터 자가 치유까지"
date: 2026-02-19 09:14:21
updated: 2026-02-20 02:33:46
publish: true
tags:
  - ZZOL
series: ZZOL 개발록
---
ZZOL 서비스에 커스텀 HealthIndicator와 자가복구(Self-Recovery) 로직을 추가하고, Health Group을 분리했다. Spring Boot의 기본 헬스체크가 어디까지 커버하고, 어디서부터 커스텀이 필요한지, 장애 감지 후 Docker 재시작 전에 애플리케이션 내부에서 먼저 복구를 시도해야 하는 이유, 그리고 DOWN과 OUT_OF_SERVICE를 왜 구분해야 하는지에 대한 판단 과정을 기록한다.

## 기본 헬스체크가 못 잡는 것

Spring Boot Actuator는 `/actuator/health`를 통해 서버 상태를 제공한다. Spring Boot가 자동으로 등록하는 HealthIndicator는 DataSource(DB 연결), Redis(PING 명령), DiskSpace(디스크 여유 공간) 등이 있다. ZZOL에서는 `show-details: always`로 상세 정보를 노출하고 있었고, Docker HEALTHCHECK가 이 엔드포인트를 30초마다 호출해서 컨테이너 상태를 판단하고 있었다.

문제는 이것만으로는 **ZZOL 도메인에서 의미 있는 장애를 감지할 수 없다**는 것이었다.

두 가지 시나리오가 기본 헬스체크를 통과하면서도 서비스에 문제를 일으킨다.

첫째, **서버가 Graceful Shutdown 중일 때.** ZZOL은 배포 시 활성 WebSocket 세션이 모두 종료될 때까지 최대 5분간 대기한다. 이 5분 동안 서버는 살아있고, DB도 연결돼 있고, Redis도 응답한다. 기본 헬스체크는 UP을 반환한다. 하지만 이 서버에 새로운 트래픽을 보내면 안 된다. 기존 연결을 드레이닝하는 중이기 때문이다. 로드밸런서가 이 상태를 감지하지 못하면 종료 중인 서버에 새 플레이어가 접속하게 된다.

둘째, **Redis Stream의 ListenerContainer가 멈췄을 때.** ZZOL은 방 생성, 방 참여, 미니게임, 레이싱 게임 등 5개 Redis Stream을 통해 이벤트를 비동기로 처리한다. `StreamMessageListenerContainer`가 예외로 인해 멈추면 이벤트 소비가 중단된다. 하지만 Redis 자체는 살아있으므로 기본 Redis HealthIndicator(PING)는 UP을 반환한다. DB도 정상이다. 그러나 이벤트 소비가 멈춘 서버는 실질적으로 절반의 기능이 죽은 상태다.

## 첫 번째 판단: 뭘 HealthIndicator에 넣을 것인가

처음에는 "서비스에 문제가 될 수 있는 모든 것"을 HealthIndicator에 넣으려고 했다. WebSocket 세션 수가 갑자기 0으로 떨어지면 DOWN, DB 커넥션 풀 사용률이 90%를 넘으면 DOWN, 이런 식이었다.

하지만 한 가지 중요한 제약을 간과하고 있었다. **Docker HEALTHCHECK에서 DOWN이 반환되면 컨테이너가 재시작된다.** HealthIndicator는 "이 상태가 비정상인가"를 판단하는 게 아니라, **"이 서버를 재시작하면 문제가 해결되는가"**를 판단해야 한다.

WebSocket 세션 수가 0인 건 서버를 재시작한다고 해결되는 문제가 아니다. 클라이언트가 접속하지 않은 것뿐이다. DB 커넥션 풀 사용률이 높은 것도 재시작으로 순간적으로 해소되지만, 근본 원인(슬로우 쿼리 등)이 해결되지 않으면 재시작 후 다시 올라간다. 이런 것들은 HealthIndicator가 아니라 **알림(Alerting)**으로 가야 한다.

이 기준을 적용하면 HealthIndicator에 넣어야 하는 항목이 명확해진다.

|상태|재시작으로 복구 가능?|HealthIndicator에 넣는가?|
|---|---|---|
|Redis Stream Container 중단|ㅇㅇ. 재시작 시 container 재생성|넣음|
|Graceful Shutdown 진행 중|재시작이 아니라 트래픽 차단이 필요|넣음 (단, DOWN이 아닌 OUT_OF_SERVICE)|
|WebSocket 세션 수 급감|재시작으로 해결 안 됨|안 넣음. 알림으로 처리|
|DB 커넥션 풀 고갈|일시적 해소만 가능|안 넣음. 알림으로 처리|

## 두 번째 판단: DOWN과 OUT_OF_SERVICE는 왜 다른가

Redis Stream Container가 멈추면 DOWN을 반환한다. Graceful Shutdown 중에는 OUT_OF_SERVICE를 반환한다. 둘 다 "이 서버에 트래픽을 보내면 안 된다"는 건 같은데, 왜 구분해야 하는가.

**DOWN은 "장애"를 의미한다.** Docker HEALTHCHECK에서 DOWN을 연속으로 받으면(`retries` 횟수만큼) 컨테이너를 재시작한다. Redis Stream Container가 멈춘 건 장애이고, 재시작으로 복구 가능하므로 DOWN이 맞다.

**OUT_OF_SERVICE는 "의도적인 서비스 중단"을 의미한다.** Graceful Shutdown은 배포를 위한 의도적인 종료 과정이다. 이 상태에서 컨테이너를 재시작하면 세션 드레이닝이 중단되고, 게임 중인 플레이어의 WebSocket 연결이 강제로 끊긴다. Graceful Shutdown을 구현한 의미가 사라진다.

```
Redis Stream Container stopped → DOWN → Docker restarts → Container recovered ✓
Graceful Shutdown in progress → OUT_OF_SERVICE → Docker does NOT restart → Session draining continues ✓
```

처음에는 Graceful Shutdown에도 DOWN을 썼다가 이 문제를 발견했다. Graceful Shutdown이 시작되면 Docker가 "장애"로 판단하고 컨테이너를 재시작하려는데, 서버는 종료 중이므로 재시작과 종료가 충돌한다. OUT_OF_SERVICE로 바꾸면 Docker HEALTHCHECK는 이 상태를 unhealthy로 판단하지 않으면서, 로드밸런서는 이 인스턴스를 트래픽 분배 대상에서 제외할 수 있다.

단, 이 동작은 Docker HEALTHCHECK 설정에 따라 다르다. Docker의 기본 HEALTHCHECK는 "healthy 또는 unhealthy"만 구분하고, HTTP 상태 코드를 직접 해석하지 않는다. `wget --spider`가 200이 아닌 503(OUT_OF_SERVICE의 기본 HTTP 상태)을 받으면 exit 1을 반환하므로, Docker 입장에서는 unhealthy로 처리될 수 있다. 이 부분은 로드밸런서(ALB 등)의 Health Check 설정에서 200만 healthy로 인식하도록 구성해야 한다.

## 세 번째 판단: 재시작이 정말 첫 번째 선택지인가

초기 설계에서는 Redis Stream Container가 멈추면 즉시 DOWN을 반환해서 Docker가 컨테이너를 재시작하도록 했다. 코드 리뷰에서 중요한 지적이 들어왔다.

**"단일 인스턴스 구조에서 컨테이너 재시작은 곧 100% 다운타임이다. ListenerContainer가 예외로 멈췄다면, 서버 전체를 죽이는 대신 해당 Container 빈만 다시 시작하는 Fallback 로직을 먼저 구현해야 하지 않나?"**

맞는 지적이었다. Container 하나 멈춘 건데 서버 전체를 재시작하는 건 과한 대응이다. 외부 인프라(Docker)에 의한 강제 재시작은 항상 최후의 보루(Last Resort)여야 한다.

이 원칙을 적용해서 복구 흐름을 3단계로 재설계했다.

```
Container stopped
       |
       v
[1] Recovery: container.start() 시도 (30초 주기)
       |
    성공? ──→ 정상 복귀. HealthIndicator는 UP.
       |
       no
       |
       v
[2] Recovery: 재시도 (최대 2회)
       |
    성공? ──→ 정상 복귀
       |
       no
       |
       v
[3] HealthIndicator: DOWN 반환 → Docker 재시작 (Last Resort)
```

여기서 중요한 설계 결정이 하나 있었다. **HealthIndicator 안에서 복구 로직을 실행하면 안 된다.** HealthIndicator는 "상태를 보고하는 역할"이지 "상태를 고치는 역할"이 아니다. Docker가 30초마다 헬스체크를 호출하는데, 매번 부수효과(side effect)가 발생하면 책임이 섞인다.

그래서 두 컴포넌트를 분리했다.

`RedisStreamContainerRecovery`는 30초 주기의 스케줄 태스크로, 모든 container 상태를 감시하고 멈춘 container에 `start()`를 호출한다. 2회 연속 실패하면 "복구 불가"로 판정한다.

`RedisStreamHealthIndicator`는 Recovery의 결과만 읽어서 보고한다. "복구 불가" 판정이 난 스트림이 있으면 DOWN을 반환한다.

```java
// Recovery: 상태 감시 + 복구 시도 (쓰기)
@Scheduled(fixedDelay = 30_000, initialDelay = 60_000)
public void checkAndRecover() {
    for (String streamKey : STREAM_KEYS) {
        StreamMessageListenerContainer<?, ?> container = getContainer(streamKey);

        if (container.isRunning()) {
            recoveryFailureCounts.remove(streamKey);
            failedRecoveryStreams.remove(streamKey);
            continue;
        }

        // 멈춘 container → start() 시도
        container.start();

        if (!container.isRunning()) {
            int failCount = recoveryFailureCounts.merge(streamKey, 1, Integer::sum);
            if (failCount >= MAX_RECOVERY_ATTEMPTS) {
                failedRecoveryStreams.add(streamKey);  // 복구 포기
            }
        }
    }
}
```

```java
// HealthIndicator: Recovery 결과만 읽기 (읽기 전용)
@Override
public Health health() {
    if (containerRecovery.hasUnrecoverableStreams()) {
        return Health.down()
                .withDetail("unrecoverable", containerRecovery.getFailedRecoveryStreams())
                .withDetail("action", "Internal recovery failed. Docker restart required.")
                .build();
    }
    return Health.up().withDetails(details).build();
}
```

Recovery가 복구를 시도하는 동안에는 container가 STOPPED여도 HealthIndicator는 UP을 반환한다. 아직 내부에서 복구 중이니까 Docker가 개입할 단계가 아니다. 2회 연속 실패해서 "복구 불가"가 확정돼야 비로소 DOWN을 반환하고, Docker 재시작이 last resort로 트리거된다.

## 네 번째 판단: Health Group을 왜 분리하는가

Spring Boot Actuator는 Health Group 기능을 제공한다. 하나의 `/actuator/health` 아래에 여러 그룹을 만들 수 있다.

```yaml
management:
  endpoint:
    health:
      group:
        liveness:
          include: "ping"
        readiness:
          include: "db,redis,gracefulShutdown,redisStream"
```

**Liveness**(`/actuator/health/liveness`)는 "이 프로세스가 살아있는가"만 판단한다. PING 하나면 충분하다. JVM이 죽었거나 응답 불가 상태인지만 체크한다.

**Readiness**(`/actuator/health/readiness`)는 "이 서버가 트래픽을 받을 준비가 됐는가"를 판단한다. DB 연결, Redis 연결, Graceful Shutdown 상태, Redis Stream Container 상태를 모두 확인한다.

이 분리가 중요한 이유는 **Docker HEALTHCHECK와 로드밸런서가 서로 다른 관심사를 갖기 때문**이다. Docker는 "컨테이너를 재시작할지"를 결정해야 하고, 로드밸런서는 "이 인스턴스에 트래픽을 보낼지"를 결정해야 한다. 하나의 엔드포인트로 두 가지를 모두 판단하면 의도하지 않은 동작이 발생할 수 있다.

ZZOL에서는 Docker HEALTHCHECK가 readiness 엔드포인트를 사용하도록 설정했다. 이유는 단순하다. 현재 단일 인스턴스 구조이기 때문에, liveness 체크만으로는 부족하고, readiness 수준의 체크가 컨테이너 재시작 판단에 더 적합하다고 판단했다. 멀티 인스턴스 + 로드밸런서 구조로 전환하면, Docker는 liveness를, 로드밸런서는 readiness를 사용하도록 분리할 수 있다.

## 결과: /actuator/health/readiness 응답

적용 후 readiness 엔드포인트의 응답은 다음과 같은 구조가 된다.

```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "redis": { "status": "UP" },
    "gracefulShutdown": { "status": "UP" },
    "redisStream": {
      "status": "UP",
      "details": {
        "room": "RUNNING",
        "room:join": "RUNNING",
        "cardgame:select": "RUNNING",
        "minigame": "RUNNING",
        "racinggame": "RUNNING"
      }
    }
  }
}
```

기본 헬스체크만 사용할 때와 비교하면, Graceful Shutdown 진행 여부와 Redis Stream 이벤트 처리 상태를 추가로 감지할 수 있게 됐다.

|Before|After|
|---|---|
|DB 연결, Redis PING, 디스크만 체크|+ Graceful Shutdown 상태, Redis Stream Container 상태|
|종료 중에도 UP → 새 트래픽 유입|종료 중 OUT_OF_SERVICE → 트래픽 차단|
|Stream Container 멈추면 즉시 서버 재시작|내부 복구 2회 시도 → 실패 시에만 재시작|
|단일 엔드포인트|liveness/readiness 그룹 분리|

## 정리

HealthIndicator에 뭘 넣을지의 기준은 "재시작으로 복구 가능한가"였다. 재시작으로 해결되는 문제는 HealthIndicator가 DOWN을 반환해서 자동 복구를 트리거하고, 재시작으로 해결 안 되는 문제는 알림으로 사람에게 알려야 한다. 그리고 의도적인 서비스 중단(Graceful Shutdown)은 DOWN도 아니고 UP도 아닌 OUT_OF_SERVICE로 표현해야, 재시작과 종료가 충돌하지 않는다.

단, Docker 재시작은 최후의 보루여야 한다. 단일 인스턴스에서 컨테이너 재시작은 100% 다운타임이다. 애플리케이션 내부에서 먼저 복구를 시도하고, 그래도 안 될 때만 외부 인프라에 의한 재시작을 허용하는 구조가 올바른 단계적 복구 전략이다.