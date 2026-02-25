---
title: "설계는 검증되어야 한다: 3단계 자가 치유 아키텍처 장애 시뮬레이션"
date: 2026-02-21 03:19:24
updated: 2026-02-25 23:56:08
publish: true
tags:
  - ZZOL
series: ZZOL 개발록
---
"장애가 발생했습니다. 서버 재시작할까요?"
서비스 초기, 개발자라면 누구나 한 번쯤 장애 알림을 보고 무의식적으로 재시작을 한 경험이 있을거다. 하지만 단일 인스턴스에서 강제 재시작은 곧 100% 다운타임을 의미하고, 이걸 어떻게 해결할까 고민했던 과정을 기록해본다.

[[custom_health_check]] 글에서 커스텀 HealthIndicator와 3단계 자가복구 계층을 설계했다. 이 글에서는 dev 환경에서 5가지 장애 시나리오를 재현하여 복구 계층이 의도대로 동작하는지 검증한 과정을 남긴다.

## 검증하려는 것

이전 글에서 설계한 복구 계층은 이렇다.

```
[Failure]
    |
    v
Level 0: Lettuce auto-reconnect (ms~sec outage)
    |
    v  (if Container stopped)
Level 1: Recovery container.start() (max 2 attempts)
    |
    v  (if Recovery failed)
Level 2: Docker restart (last resort)
```

3개의 레벨이 각자 역할에서만 개입하고, 상위 레벨로 불필요하게 넘어가지 않는 것이 설계 의도다. 단위 테스트로는 Recovery가 `container.start()`를 호출하면 성공을 반환한다는 것까지 검증할 수 있다. 하지만 Lettuce 재연결 → Stream Container 상태 변화 → Recovery 감지 → HealthIndicator 전환 → Docker HEALTHCHECK 반응이라는 **전체 체인**은 실제 인프라에서 돌려봐야 알 수 있다.

시뮬레이션에서 확인하고 싶었던 질문은 세 가지다.

1. Level 0(Lettuce)과 Level 1(Recovery)의 **경계**는 어디인가. Redis가 몇 초간 끊어져야 Stream Container가 멈추는가.
2. Recovery가 `container.start()`를 호출했을 때, Redis가 아직 안 올라온 상태면 **어떤 일이 벌어지는가.**
3. Graceful Shutdown 시 OUT_OF_SERVICE가 Docker HEALTHCHECK에서 **실제로 재시작을 방지하는가.**

시나리오 5개는 이 세 가지 질문에 답하기 위해 설계했다.

## 시뮬레이션 방법의 선택

장애를 재현하는 방법에는 세 가지가 있다.

`docker stop`은 Redis에 SIGTERM을 보내서 깨끗하게 종료시킨다. TCP RST 패킷이 전달되므로 Lettuce가 즉시 연결 끊김을 인지한다. `iptables DROP`은 Redis 포트의 패킷을 무조건 버린다. 커넥션은 살아있는데 응답이 안 오는 상황(Network Blackhole)을 만든다. `tc`(Traffic Control)는 지연, 패킷 유실률 등을 세밀하게 조절할 수 있다.

운영에서 가장 무서운 장애는 네트워크 파티션이다. 프로세스가 죽는 건 빠르게 감지되지만, 패킷이 유실되어 응답만 안 오는 상황은 Lettuce command timeout(60초)까지 스레드가 블로킹된다. 하지만 이번 시뮬레이션의 목적은 **Recovery → HealthIndicator → Docker HEALTHCHECK 체인의 동작 검증**이다. `docker stop`은 "Redis가 죽었다 → Container가 멈췄다 → Recovery가 감지한다"라는 인과 체인을 깔끔하게 재현할 수 있다. 네트워크 파티션은 Lettuce timeout과 스레드 풀 고갈까지 범위가 확장되므로 별개의 주제로 분리했다.

## 시나리오 설계: 왜 이 5개인가

5개 시나리오는 복구 계층의 각 경계 조건을 하나씩 찌르도록 설계했다.

|시나리오|검증 대상|
|---|---|
|1. Redis 3초 중단|Level 0 → Level 1 경계. 짧은 중단에서 Recovery가 개입하지 않는가?|
|2. Redis 30초 중단 후 복구|Level 1 정상 동작. Recovery가 Container를 재시작하는가?|
|3. Redis 2분+ 장기 중단|Level 1 → Level 2 전환. Recovery 실패 후 Docker 재시작이 트리거되는가?|
|4. Graceful Shutdown|OUT_OF_SERVICE가 Docker 재시작을 방지하는가?|
|5. Redis 40초 중단 후 복구|Recovery 연속 실패 카운트 초기화. 1차 실패 후 2차 성공 시 DOWN에 도달하지 않는가?|

시나리오 1과 2는 Level 0과 Level 1의 경계를 확인한다. 시나리오 2와 3은 Level 1과 Level 2의 경계를 확인한다. 시나리오 5는 시나리오 3의 변형으로, "Recovery 실패가 항상 Docker 재시작으로 이어지는 건 아니다"라는 것을 보여준다.

## 시나리오 1: Redis 3초 중단 — Level 0과 Level 1의 경계

Redis를 3초간 중단했다가 재시작했다.

```bash
docker stop dev-redis && sleep 3 && docker start dev-redis
```

|시각|이벤트|
|---|---|
|T+0s|`docker stop dev-redis`|
|T+3s|`docker start dev-redis`|
|T+5s|Lettuce `Reconnected to dev-redis`|
|T+30s|Recovery 주기 도달. `container.isRunning()` = true. 개입 없음|

Recovery가 개입하지 않았다. `docker stop`으로 Redis 프로세스가 종료되면 TCP RST 패킷이 전달되고, Lettuce는 command timeout(60초)을 기다리지 않고 즉각 재연결을 시도한다. Redis가 3초 만에 다시 띄워졌고 Lettuce가 재연결을 완료했으므로, Stream Container는 일시적 에러를 겪었을 뿐 STOPPED 상태로 빠지지 않았다. 30초 주기로 도는 Recovery 스케줄러가 감지했을 때는 이미 정상이었다.

이 결과로 Level 0과 Level 1의 경계가 드러났다. Redis가 수 초간 중단되는 수준에서는 Lettuce 자체 재연결로 충분하다. Stream Container가 실제로 STOPPED에 빠지려면, Lettuce의 재연결 시도를 넘어서는 시간 동안 Redis가 죽어있어야 한다.

## 시나리오 2: Redis 30초 중단 → Recovery 자가복구 성공

Redis를 30초간 중단한 뒤 재시작.

```bash
docker stop dev-redis
# ... 30초 대기 ...
docker start dev-redis
# ... 30초 대기 (Recovery 다음 주기) ...
```

|시각|이벤트|
|---|---|
|T+0s|`docker stop dev-redis`|
|T+1s|Lettuce `Reconnecting` 반복|
|T+~10s|Stream Container의 `xRead` 에러 반복 → Container STOPPED|
|T+30s|`docker start dev-redis`|
|T+32s|Lettuce `Reconnected`|
|T+60s|Recovery: Stream Container STOPPED 감지 → `container.start()` 성공|
|T+60s|`recoveryFailureCounts` 초기화. HealthIndicator UP 유지|

시나리오 1과 결정적으로 다른 지점이 T+32s와 T+60s 사이에 있다. T+32s에 Lettuce가 재연결됐지만, **Stream Container는 여전히 STOPPED다.** Lettuce는 Redis 커넥션을 복구할 뿐, `StreamMessageListenerContainer`의 생명주기까지 관리하지 않는다. Container가 STOPPED 상태로 빠진 뒤에는 누군가가 명시적으로 `container.start()`를 호출해야 한다.

이것이 Recovery(Level 1)가 존재하는 핵심 이유다. Lettuce(Level 0)가 해결하는 것은 커넥션 복구다. Stream Container의 이벤트 소비 재개는 별개의 문제이고, 이 격차를 Recovery가 메운다.

Recovery가 `container.start()`를 성공한 뒤 `recoveryFailureCounts`를 초기화한다. 이 초기화가 없으면 이전 장애의 failure count가 남아서, 다음 장애 시 Recovery가 1회만 시도하고 포기할 수 있다. Recovery는 "지금 이 순간"의 연속 실패만 판단한다. 과거 장애 이력은 개입하지 않는다.

## 시나리오 3: Redis 장기 중단 → Recovery 실패 → Docker 재시작

Redis를 2분 이상 중단한 채로 유지.

```bash
docker stop dev-redis
# ... 2분+ 대기 ...
```

|시각|이벤트|
|---|---|
|T+0s|`docker stop dev-redis`|
|T+60s|Recovery 1차: `container.start()` → 실패 (1/2)|
|T+90s|Recovery 2차: `container.start()` → 실패 (2/2)|
|T+90s|`failedRecoveryStreams` 등록 → HealthIndicator DOWN|
|T+120~180s|Docker HEALTHCHECK 3회 연속 unhealthy → 컨테이너 재시작|

readiness 응답이 바뀌었다.

```json
{
  "status": "DOWN",
  "components": {
    "redisStream": {
      "status": "DOWN",
      "details": {
        "unrecoverable": ["minigame", "racinggame", "room", "room:join", "cardgame:select"],
        "action": "Internal recovery failed. Docker restart required."
      }
    }
  }
}
```

Recovery 1차에서 `container.start()`를 호출하지만, Redis가 죽어있으니 Container가 시작 직후 다시 멈춘다. 2차도 동일. 2회 연속 실패로 HealthIndicator가 DOWN을 반환하고, Docker HEALTHCHECK가 3회 연속 unhealthy를 감지한 뒤 컨테이너를 재시작한다.

이 시나리오는 Level 2(Docker 재시작)가 **last resort로서 동작하는 것**을 확인하기 위한 것이다. 하지만 동시에 하나의 의문이 생긴다. Redis가 완전히 죽어있으면 Recovery의 2회 시도가 결국 헛수고다. 이 60초가 낭비 아닌가?

이 질문의 답은 시나리오 5에서 나온다. 운영에서 Redis가 "완전히 죽어서 안 돌아오는" 상황보다 "잠깐 죽었다가 수십 초 후에 돌아오는" 상황이 훨씬 흔하다. Recovery의 2회 시도가 확보하는 60초는 "Redis가 곧 살아날 가능성"에 베팅하는 것이다.

## 시나리오 4: Graceful Shutdown — OUT_OF_SERVICE 확인

SIGTERM을 전송하여 Graceful Shutdown 시작.

```bash
docker kill --signal=SIGTERM dev-app-blue
```

|시각|이벤트|
|---|---|
|T+0s|SIGTERM 수신. readiness: UP → OUT_OF_SERVICE|
|T+1s|WebSocket 세션 드레이닝 시작|
|T+~30s|활성 세션 없음 → 종료 완료|

DOWN이 아니라 OUT_OF_SERVICE다. 이 구분이 실제로 의미 있는지 확인하려면, "DOWN이었다면 어떻게 됐을까"를 생각해봐야 한다.

Graceful Shutdown이 DOWN을 반환했다면, Docker HEALTHCHECK는 "장애 발생"으로 판단하고 재시작을 시도한다. 그런데 서버는 SIGTERM에 의한 종료를 진행 중이다. **재시작과 종료가 경합한다.** 세션 드레이닝이 중단되고 게임 중인 플레이어의 WebSocket 연결이 강제로 끊긴다.

OUT_OF_SERVICE는 Spring Boot에서 HTTP 503을 반환한다. 여기서 한 가지 더 판단이 필요하다. Docker HEALTHCHECK가 `wget --spider`를 사용하면 503에서 exit 1을 반환하므로 unhealthy로 처리될 수 있다. 그래서 HEALTHCHECK 스크립트를 `wget -qO-`로 바꾸고, HTTP 상태 코드가 아니라 응답 본문의 `status` 필드를 파싱해서 `DOWN`일 때만 unhealthy로 판정하도록 구성했다. OUT_OF_SERVICE는 "트래픽을 보내지 마라"이지 "서버를 죽여라"가 아니기 때문이다.

## 시나리오 5: Recovery 1차 실패 → Redis 복구 → 2차 성공

시나리오 3에서 제기된 "Recovery 2회 시도가 낭비 아닌가?"에 답하는 시나리오.

```bash
docker stop dev-redis
# ... 40초 대기 (Recovery 1차 실패 유도) ...
docker start dev-redis
# ... 30초 대기 (Recovery 2차 주기) ...
```

|시각|이벤트|
|---|---|
|T+0s|`docker stop dev-redis`|
|T+60s|Recovery 1차: 실패 (1/2)|
|T+70s|`docker start dev-redis`|
|T+90s|Recovery 2차: `container.start()` → 성공. failureCount 초기화|

Recovery 1차(T+60s)에는 Redis가 없어서 실패한다. 하지만 T+70s에 Redis가 돌아왔고, 2차(T+90s)에는 성공한다. `recoveryFailureCounts`가 0으로 초기화되면서 HealthIndicator는 DOWN에 도달하지 않는다.

만약 `MAX_RECOVERY_ATTEMPTS`가 1이었다면, 이 상황에서 Docker 재시작이 트리거됐을 것이다. Redis가 10초 뒤에 살아날 건데, 서버 전체를 재시작하는 것이다. 단일 인스턴스에서 이건 100% 다운타임이다.

`MAX_RECOVERY_ATTEMPTS` 값의 선택지는 셋이었다.

```
MAX_RECOVERY_ATTEMPTS=1: Too aggressive. No room for Redis restart delay.
MAX_RECOVERY_ATTEMPTS=2: ~60s buffer. Docker restart within ~2.5 min.
MAX_RECOVERY_ATTEMPTS=3: ~90s buffer. But 3+ min total downtime if unrecoverable.
```

1은 Recovery가 존재하는 의미를 없앤다. 3은 복구 불가능한 상황에서 3분 이상 장애가 지속된다. 2는 60초의 복구 대기 시간을 확보하면서, 진짜 안 되면 약 2분 30초 이내에 Docker 재시작으로 넘어간다. 2로 결정했다.

## 종합

|시나리오|Recovery|HealthIndicator|Docker 재시작|
|---|---|---|---|
|Redis 3초 중단|미개입 (Lettuce)|UP|없음|
|Redis 30초 중단 후 복구|1차 성공|UP|없음|
|Redis 2분+ 장기 중단|2차 연속 실패|DOWN|발생|
|Graceful Shutdown|미개입|OUT_OF_SERVICE|없음|
|Redis 40초 중단 후 복구|1차 실패, 2차 성공|UP|없음|

5개 시나리오 중 Docker 재시작(Level 2)이 발생한 건 1개뿐이다. 나머지 4개는 Level 0 또는 Level 1에서 흡수됐다.

처음에 던졌던 세 가지 질문에 대한 답:

Level 0과 Level 1의 경계는 "Redis 중단이 수 초 vs 수십 초"에서 갈린다. 수 초 중단은 Lettuce가 흡수하고, 수십 초 이상 중단돼서 Stream Container가 STOPPED에 빠지면 Recovery가 개입한다(시나리오 1, 2).

Redis가 안 올라온 상태에서 `container.start()`를 호출하면, Container가 시작 직후 다시 멈추고 failure count가 증가한다. 하지만 다음 시도 전에 Redis가 돌아오면 성공하고 count가 초기화된다(시나리오 3, 5).

OUT_OF_SERVICE는 HEALTHCHECK 스크립트에서 DOWN과 구분 처리함으로써 Docker 재시작을 방지한다(시나리오 4).

## 정리

시뮬레이션의 목적은 "복구 계층이 설계대로 동작하는지 확인"이었다. `docker stop`이라는 단순한 방법이었지만, 각 레벨의 경계 조건과 전환 동작을 확인하기에 충분했다.

`docker stop`으로 검증하지 못한 영역은 남아있다. 네트워크 파티션 상황에서 Lettuce가 command timeout(60초)까지 블로킹되는 동안 WebSocket 스레드 풀이 고갈되는지, 그 상태에서 Recovery의 `@Scheduled` 태스크가 별도 스케줄러 스레드에서 제때 실행되는지는 `iptables` 기반의 별도 시뮬레이션이 필요하다.

Recovery가 개입한 사실 자체를 사람이 알 수 있는 방법이 현재는 로그뿐이라는 점도 과제다. Recovery가 성공하면 HealthIndicator는 UP을 유지하고, Docker 재시작도 발생하지 않는다. "자동 복구는 하되, 그 사실은 통보받는다"가 완전한 운영 사이클이다. Recovery 개입 횟수를 Micrometer Counter로 수집하고 알림을 추가하는 것이 다음 단계다.