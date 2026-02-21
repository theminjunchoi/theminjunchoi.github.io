---
title: "설계는 검증되어야 한다: 3단계 자가 치유 아키텍처 장애 시뮬레이션"
date: 2026-02-21 03:19:24
updated: 2026-02-22 00:30:52
publish: true
tags:
  - ZZOL
series: ZZOL 개발록
---
[[custom_health_check]] 글에서 커스텀 HealthIndicator와 3단계 자가복구 계층을 설계했다. 이 글에서는 dev 환경에서 5가지 장애 시나리오를 재현하여 복구 계층이 의도대로 동작하는지 검증한 과정을 기록한다.

## 왜 시뮬레이션이 필요한가

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

설계 시점에는 "이렇게 동작할 것이다"라는 가정이었다. Recovery의 30초 주기, 2회 연속 실패 판정, failure count 초기화 같은 세부 동작은 단위 테스트로 로직은 검증할 수 있지만, Lettuce 재연결 → Stream Container 상태 변화 → Recovery 감지 → HealthIndicator 전환 → Docker HEALTHCHECK 반응이라는 전체 체인은 실제 인프라에서 돌려봐야 알 수 있다.

## 시뮬레이션 방법의 선택

장애를 재현하는 방법에는 세 가지가 있다.

`docker stop`은 Redis에 SIGTERM을 보내서 깨끗하게 종료시킨다. TCP RST 패킷이 전달되므로 Lettuce가 즉시 연결 끊김을 인지한다. `iptables DROP`은 Redis 포트의 패킷을 무조건 버린다. 커넥션은 살아있는데 응답이 안 오는 상황(Network Blackhole)을 만든다. Lettuce는 command timeout(60초)이 만료될 때까지 스레드가 블로킹된다. `tc`(Traffic Control)는 지연, 패킷 유실률 등을 세밀하게 조절할 수 있다.

`docker stop`을 선택했다. 운영에서 가장 무서운 장애는 네트워크 파티션(Blackhole)이지만, 이번 시뮬레이션의 목적은 "Recovery → HealthIndicator → Docker HEALTHCHECK" 체인의 동작 검증이다. 네트워크 파티션은 Lettuce의 timeout 동작과 스레드 풀 고갈까지 범위가 확장되므로, 복구 체인 검증과 별개의 주제로 분리했다.

`docker stop`으로 검증할 수 없는 것은 명확하다. 패킷이 유실되어 Lettuce가 timeout까지 블로킹되는 동안 애플리케이션의 스레드 풀과 커넥션 풀이 어떻게 되는지, 그리고 그 상태에서 Recovery가 제때 개입할 수 있는지는 별도 시뮬레이션이 필요하다.

## 시나리오 1: Redis 일시적 중단 — Level 0에서 흡수

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

Recovery가 개입하지 않았다. `docker stop`으로 Redis 프로세스가 종료되면 TCP 연결이 즉시 끊어지므로, Lettuce는 타임아웃(60초)을 기다리지 않고 즉각적으로 연결 끊김을 감지하고 자체 재연결을 시도한다. Redis가 3초 만에 다시 띄워졌고 Lettuce가 재연결을 완료했기 때문에, 30초 주기로 도는 Recovery 스케줄러가 개입할 틈이 없었다.

처음에는 "Recovery가 동작해야 검증이 되는 거 아닌가?"라고 생각했다. 하지만 이것 자체가 중요한 검증이다. 짧은 Redis 중단은 Level 0(Lettuce)에서 흡수되므로, Recovery(Level 1)까지 갈 필요가 없다. 복구 계층이 "필요할 때만 개입한다"는 설계를 확인한 것이다.

## 시나리오 2: Redis 장기 중단 → Recovery 자가복구 성공

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
|T+30s|`docker start dev-redis`|
|T+32s|Lettuce `Reconnected`|
|T+60s|Recovery: Stream Container STOPPED 감지 → `container.start()` 성공|
|T+60s|`recoveryFailureCounts` 초기화. HealthIndicator UP 유지|

Recovery가 `container.start()`를 호출했고, Redis가 이미 살아있었으므로 1회차에서 즉시 복구됐다. Docker 재시작은 발생하지 않았다. Container 하나 멈춘 건데 서버 전체를 재시작하는 대신, 멈춘 것만 재시작해서 단일 인스턴스의 100% 다운타임을 회피했다.

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

Recovery로 해결할 수 없는 상황에서만 Level 2(Docker 재시작)가 트리거됐다.

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

DOWN이 아니라 OUT_OF_SERVICE이므로 Docker HEALTHCHECK가 재시작을 시도하지 않았고, 세션 드레이닝이 정상 완료됐다. 이전 글에서 DOWN과 OUT_OF_SERVICE를 구분한 설계가 검증된 시나리오다.

## 시나리오 5: Recovery 1차 실패 → Redis 복구 → 2차 성공

Recovery의 "연속 실패" 판정 로직을 검증하기 위한 경계값 테스트.

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

이 시나리오가 중요한 이유는 `MAX_RECOVERY_ATTEMPTS`의 값과 직결되기 때문이다. 처음에는 1로 설정했다. 1번 실패하면 바로 DOWN. 하지만 Redis 재시작이 30초 이상 걸리는 경우(AOF 로드 등) Recovery 1차 시점에 아직 Redis가 안 올라와서 즉시 DOWN → Docker 재시작이 트리거된다. Recovery가 존재하는 의미가 없어진다.

3으로 올리는 것도 검토했다. 3회면 약 90초의 복구 대기 시간을 확보할 수 있지만, 진짜 복구 불가능한 상황에서 Docker 재시작까지 최소 3분이 걸린다. 단일 인스턴스에서 3분은 너무 길다.

2회로 결정했다. 약 60초의 복구 대기 시간을 확보하면서, 진짜 안 되는 경우 2분 이내에 Docker 재시작으로 넘어간다. 시나리오 5가 이 판단을 검증한 것이다.

## 종합

|시나리오|Recovery|HealthIndicator|Docker 재시작|
|---|---|---|---|
|Redis 3초 중단|미개입 (Lettuce)|UP|없음|
|Redis 30초 중단 후 복구|1차 성공|UP|없음|
|Redis 2분+ 장기 중단|2차 연속 실패|DOWN|발생|
|Graceful Shutdown|미개입|OUT_OF_SERVICE|없음|
|Redis 40초 중단 후 복구|1차 실패, 2차 성공|UP|없음|

5개 시나리오 중 Docker 재시작(Level 2)이 발생한 건 1개뿐이다. 각 레벨은 이전 레벨이 해결하지 못한 상황에서만 개입한다.

## 정리

시뮬레이션 전에는 가정이었고, 시뮬레이션 후에야 검증이 됐다. `docker stop`이라는 단순한 방법이었지만, Recovery → HealthIndicator → Docker HEALTHCHECK 체인의 동작을 확인하기에 충분했다.

`docker stop`으로 검증하지 못한 영역은 남아있다. 네트워크 파티션 상황에서 Lettuce가 timeout까지 블로킹되는 동안 스레드 풀과 커넥션 풀이 어떻게 되는지, Recovery가 제때 개입할 수 있는지는 `iptables` 기반의 별도 시뮬레이션이 필요하다.

