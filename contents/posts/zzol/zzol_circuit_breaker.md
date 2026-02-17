---
title: 외부 서비스 장애에서 살아남기
date: 2026-02-17 09:42:27
updated: 2026-02-17 18:45:58
publish: true
tags:
  - ZZOL
series: ZZOL 개발록
---
`ZZOL`에서 외부 서비스 장애 대응 작업을 했다. Oracle Object Storage에 QR 코드를 업로드하는 과정에서, 외부 서비스가 불안정할 때 시스템 전체가 영향을 받는 문제가 있었다. 이 글에서는 Circuit Breaker와 Retry를 도입하면서 고민한 과정을 기록해본다.

## 문제 상황

ZZOL에서는 방을 생성할 때 QR 코드를 만든다. 이 QR 코드로 다른 플레이어들이 방에 참여할 수 있다. 흐름은 이렇다.

```
Create Room Request
    |
    v
Room created (Redis)
    |
    v
QR Code image generated (ZXing)
    |
    v
Upload to Oracle Object Storage    <-- external service call
    |
    v
Generate Public URL
    |
    v
Broadcast QR Code URL via WebSocket
```

QR 코드 생성은 비동기(`@Async`)로 처리하고 있었다. 방 생성 자체는 바로 완료되고, QR 코드는 백그라운드에서 생성된 뒤 WebSocket으로 클라이언트에 전달되는 구조다. 그래서 Oracle Object Storage 장애가 방 생성 응답 자체를 막지는 않았다.

하지만 문제가 없는 건 아니었다.

### Oracle Object Storage가 불안정하면?

Oracle Object Storage는 외부 서비스다. 네트워크 문제, Oracle Cloud 측 장애, DNS 이슈 등 다양한 이유로 실패할 수 있다. 실제로 운영 중에 간헐적으로 업로드가 실패하는 로그가 찍히고 있었다.

도입 전 코드를 보면 문제가 바로 보인다.

```java
@Override
public String upload(@NonNull String contents, byte[] data) {
    try {
        return uploadQrCodeToObjectStorage(contents, data);
    } catch (Exception e) {
        throw new StorageServiceException(
            RoomErrorCode.QR_CODE_UPLOAD_FAILED,
            RoomErrorCode.QR_CODE_UPLOAD_FAILED.getMessage(), e);
    }
}
```

단순히 한 번 시도하고, 실패하면 바로 예외를 던진다. 여기서 두 가지 문제가 있었다.

첫째, **일시적 장애에도 바로 실패한다.** 네트워크 순단 같은 일시적 문제는 한두 번 더 시도하면 성공할 수 있다. 하지만 재시도 로직이 없으니 한 번 실패하면 그냥 끝이다. 사용자는 QR 코드 없이 방 참여 코드를 직접 입력해야 한다.

둘째, **지속적 장애 시 리소스가 낭비된다.** Oracle Object Storage가 완전히 죽어 있는 상황에서도, 방이 생성될 때마다 업로드를 시도한다. 어차피 실패할 호출을 매번 보내면서 비동기 스레드를 점유하고, 타임아웃까지 대기하는 시간이 낭비된다. 동시에 방이 많이 생성되면 비동기 스레드풀이 고갈될 수도 있다.

정리하면 이렇다.

```
+-------------------------------------------------------------------+
|               Failure Type vs Behavior                            |
+-------------------------------------------------------------------+
|                                                                   |
|  Failure Type         Before              After                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Transient            Fail immediately    Retry and recover       |
|  (network blip,       -> no QR code       -> QR code delivered    |
|   timeout)                                                        |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Persistent           Retry every time    Fail fast               |
|  (Oracle Cloud        -> wasted resource  -> protect resources    |
|   outage)             -> thread pool busy -> fast response        |
|                                                                   |
+-------------------------------------------------------------------+
```

일시적 장애에는 재시도(Retry)로 복구하고, 지속적 장애에는 서킷 브레이커(Circuit Breaker)로 빠르게 차단하는 게 필요했다.

## 왜 Circuit Breaker와 Retry인가

### 다른 선택지는 없었는가

사실 단순한 재시도만으로도 일시적 장애는 해결된다. for 루프로 2번 돌리면 되지 않나? 맞다. 하지만 그것만으로는 부족하다.

지속적 장애 상황을 생각해보자. Oracle Object Storage가 30분 동안 완전히 죽어 있다고 가정하면, 그 30분 동안 생성되는 모든 방에 대해 2번씩 업로드를 시도한다. 방이 100개 생성되면 200번의 실패 호출이 발생한다. 각 호출마다 타임아웃(보통 수 초)까지 대기하니까, 비동기 스레드풀에 걸리는 부하가 상당하다.

서킷 브레이커는 이 문제를 해결한다. 실패가 일정 비율 이상 누적되면, 아예 호출을 차단해버린다. "어차피 실패할 거 시도도 하지 마"라는 전략이다. 그리고 일정 시간이 지나면 조심스럽게 다시 시도해서, 서비스가 복구됐는지 확인한다.

### 왜 Resilience4j인가

Spring Cloud Circuit Breaker는 Resilience4j, Hystrix, Sentinel, Spring Retry 등 여러 구현체를 지원한다. 이 중에서 Resilience4j를 선택했다.

Hystrix는 Netflix가 개발했고 한때 사실상 표준이었지만, 2018년에 유지보수 모드로 전환됐다. 새로운 기능 추가가 없고, Spring Boot 3.x와의 호환성도 보장되지 않는다. Sentinel은 Alibaba가 만든 라이브러리로 Flow Control에 강점이 있지만, 국내에서는 사용 사례가 적고 커뮤니티가 상대적으로 작다. Spring Retry는 단순 재시도에는 좋지만, 서킷 브레이커의 세밀한 상태 관리(슬라이딩 윈도우, HALF_OPEN 등)에는 한계가 있다.

Resilience4j는 Java 17+ 지원, Spring Boot 3.x 공식 지원, 가볍고 모듈화된 설계 등 현재 시점에서 가장 적합했다. 서킷 브레이커, 리트라이, 레이트 리미터, 벌크헤드 등을 독립적인 모듈로 제공해서, 필요한 것만 골라 쓸 수 있다. 이번에는 서킷 브레이커와 리트라이 두 가지만 사용했다.

## Retry 설계

### 설정값 결정

```yaml
resilience4j:
  retry:
    retry-aspect-order: 2
    instances:
      oracleStorage:
        maxAttempts: 2
        waitDuration: 500ms
        retryExceptions:
          - java.io.IOException
          - com.oracle.bmc.model.BmcException
          - java.lang.RuntimeException
```

**maxAttempts: 2**

처음에는 3으로 설정했다가 2로 줄였다. QR 코드 업로드는 비동기로 처리되기 때문에, 사용자가 직접 대기하는 건 아니다. 하지만 비동기 스레드를 점유하는 시간은 줄이고 싶었다. Oracle Object Storage 업로드는 이미지 하나당 수백 ms가 걸린다. maxAttempts가 3이면 최악의 경우 `500ms(대기) + 업로드 시간` × 2번의 추가 시도가 발생한다.

실제로 일시적 장애(네트워크 순단 등)는 대부분 1번의 재시도로 복구된다. 2번째 시도에서도 실패하면 일시적 장애가 아니라 지속적 장애일 가능성이 높다. 그때는 서킷 브레이커가 처리하는 게 맞다.

**waitDuration: 500ms**

재시도 간격이다. 너무 짧으면 같은 문제가 아직 해결되지 않은 상태에서 재시도하게 되고, 너무 길면 비동기 스레드 점유 시간이 길어진다. Oracle Object Storage 업로드의 평균 응답 시간이 200~400ms인 점을 고려해서 500ms로 설정했다.

**retryExceptions**

어떤 예외에서 재시도할 것인가도 중요한 결정이었다. 처음에는 `IOException`과 `BmcException`만 넣었다가, `RuntimeException`도 추가했다. Oracle OCI SDK가 내부적으로 RuntimeException을 던지는 케이스가 있었기 때문이다.

다만 모든 예외에서 재시도하는 건 위험하다. `IllegalArgumentException` 같은 프로그래밍 오류는 몇 번을 재시도해도 결과가 같다. retryExceptions에 명시한 예외만 재시도하고, 나머지는 바로 실패 처리된다.

### 재시도하면 안 되는 예외를 구분한 이유

이건 테스트 코드에서도 검증했다.

```java
@Test
@DisplayName("retryExceptions에 없는 예외는 리트라이하지 않는다")
void retryExceptions에_없는_예외는_리트라이_안함() {
    when(objectStorage.putObject(any(PutObjectRequest.class)))
            .thenThrow(new IllegalArgumentException("Invalid argument"));

    Supplier<String> decoratedSupplier = Retry.decorateSupplier(
            retry,
            () -> storageService.upload("test", "data".getBytes())
    );

    assertThatThrownBy(decoratedSupplier::get)
            .isInstanceOf(IllegalArgumentException.class);

    // 1번만 호출됨 (리트라이 안 함)
    verify(objectStorage, times(1)).putObject(any(PutObjectRequest.class));
}
```

`IllegalArgumentException`은 retryExceptions에 없으니 재시도 없이 바로 실패한다. 잘못된 인자를 넣은 건 재시도한다고 고쳐지지 않기 때문이다.

## Circuit Breaker 설계

### 설정값 결정

```yaml
resilience4j:
  circuitbreaker:
    circuit-breaker-aspect-order: 1
    instances:
      oracleStorage:
        slidingWindowType: COUNT_BASED
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        recordExceptions:
          - java.io.IOException
          - com.oracle.bmc.model.BmcException
          - java.lang.RuntimeException
```

서킷 브레이커의 상태 전이를 정리하면 이렇다.

```
                    failure rate < 50%
              +------------------------+
              |                        |
              v                        |
         +---------+             +-----------+
  ------>| CLOSED  |------------>|   OPEN    |
         +---------+ failure    +-----------+
              ^       rate >= 50%      |
              |                        | after 30s
              |                        v
              |                 +------------+
              +-----------------|  HALF_OPEN |
                success rate    +------------+
                 sufficient      3 trial calls
```

각 설정값을 왜 이렇게 잡았는지 설명한다.

**slidingWindowType: COUNT_BASED**

시간 기반(TIME_BASED)이 아니라 횟수 기반(COUNT_BASED)을 선택했다. QR 코드 업로드는 방 생성 시에만 발생하기 때문에, 호출 빈도가 일정하지 않다. 시간 기반이면 한가한 시간대에 1~2건만 실패해도 실패율 100%로 계산돼서 서킷이 열릴 수 있다. 횟수 기반이면 최소 10건의 샘플이 모여야 판단하기 때문에 더 안정적이다.

**slidingWindowSize: 10 + failureRateThreshold: 50**

최근 10건 중 5건 이상 실패하면 서킷을 연다. "10건 중 5건"이라는 기준이 적절한지 고민했다.

너무 작게 잡으면(예: 5건 중 3건) 일시적 장애에도 서킷이 열려서 과민 반응한다. 너무 크게 잡으면(예: 50건 중 25건) 이미 장애가 충분히 진행된 뒤에야 차단되니까 리소스 보호 효과가 줄어든다.

ZZOL의 트래픽을 고려했다. 동시 접속자가 많은 시간대에 분당 10~20개의 방이 생성된다. 10건이면 약 30초~1분 분량의 호출이다. 이 정도면 "일시적 문제인지 지속적 장애인지"를 판단하기에 충분한 샘플이라고 봤다.

**waitDurationInOpenState: 30s**

서킷이 OPEN 상태가 되면 30초 동안 모든 호출을 차단한다. 30초 후 HALF_OPEN 상태로 전환되면서 시험 호출을 보낸다.

왜 30초인가? Oracle Object Storage 장애가 발생하면 보통 수 분 내에 복구되거나, 아니면 장기 장애로 이어진다. 30초면 짧은 장애는 복구될 시간이고, 장기 장애라면 HALF_OPEN에서 다시 실패해서 OPEN으로 돌아간다.

**permittedNumberOfCallsInHalfOpenState: 3**

HALF_OPEN 상태에서 3건의 시험 호출을 허용한다. 1건만 허용하면 네트워크 지터 같은 일시적 문제로 잘못 판단할 수 있고, 너무 많으면 아직 불안정한 서비스에 부하를 줄 수 있다. 3건이면 2건 이상 성공해야 CLOSED로 전환되니까, 복구 여부를 합리적으로 판단할 수 있다.

**automaticTransitionFromOpenToHalfOpenEnabled: true**

OPEN → HALF_OPEN 전환을 자동으로 한다. 이걸 `false`로 두면 OPEN 상태에서 새로운 호출이 들어와야 HALF_OPEN으로 전환된다. 하지만 서킷이 열린 상태에서 호출이 한동안 안 들어올 수도 있다. 자동 전환을 켜두면 30초 후 알아서 HALF_OPEN으로 전환되고, 다음 호출에서 바로 시험할 수 있다.

### aspect-order: 왜 순서가 중요한가

```yaml
circuit-breaker-aspect-order: 1
retry-aspect-order: 2
```

여기서 숫자가 작을수록 바깥쪽 AOP다. 즉 호출 순서가 이렇다.

```
Request --> CircuitBreaker (order=1) --> Retry (order=2) --> actual method
```

서킷이 OPEN이면 Retry까지 가지 않고 바로 차단된다. 서킷이 CLOSED면 Retry가 안쪽에서 재시도하고, 최종 결과(성공 or 실패)만 CircuitBreaker에 기록된다.

만약 반대로 Retry가 바깥이면 어떻게 될까?

```
+-------------------------------------------------------------------+
|                   Aspect Order Comparison                         |
+-------------------------------------------------------------------+
|                                                                   |
|  Order            Circuit OPEN         Circuit CLOSED             |
|  -----------------------------------------------------------------|
|                                                                   |
|  CB -> Retry      Block immediately,   Retry first, then record  |
|  (correct)        no retry attempt     final result to CB         |
|                                                                   |
|  -----------------------------------------------------------------|
|                                                                   |
|  Retry -> CB      CallNotPermitted     Each attempt recorded     |
|  (wrong)          thrown twice,         to CB separately,         |
|                   pointless retry      failure count inflated    |
|                                                                   |
+-------------------------------------------------------------------+
```

서킷이 열려 있으면 재시도해봤자 소용없다. CircuitBreaker를 바깥에 두면, 서킷이 OPEN일 때 Retry까지 가지 않고 바로 차단된다.

반대로 서킷이 CLOSED일 때는 Retry가 안쪽에서 재시도한다. 재시도까지 해서 최종적으로 성공하면 CircuitBreaker에는 "성공"으로 기록된다. 재시도까지 해서도 실패하면 그때 "실패"로 기록된다. 서킷 브레이커 입장에서는 Retry까지 포함한 최종 결과만 보는 것이다.

## 구현

### Fallback 메서드 설계

```java
@Override
@CircuitBreaker(name = "oracleStorage", fallbackMethod = "uploadFallback")
@Retry(name = "oracleStorage")
public String upload(@NonNull String contents, byte[] data) {
    if (data.length == 0) {
        throw new StorageServiceException(
            RoomErrorCode.QR_CODE_UPLOAD_FAILED, "QR 이미지 바이트가 비어 있습니다.");
    }
    return doUpload(contents, data);
}
```

기존 코드에서 달라진 점은 두 가지다. `@CircuitBreaker`와 `@Retry` 어노테이션이 추가됐고, try-catch가 사라졌다.

try-catch를 제거한 이유가 있다. Resilience4j는 메서드가 던지는 예외 타입을 보고 "이건 재시도할 예외인가", "이건 서킷 브레이커에 실패로 기록할 예외인가"를 판단한다. 만약 메서드 내부에서 모든 예외를 잡아서 `StorageServiceException`으로 감싸버리면, Resilience4j는 원본 예외 타입을 알 수 없다. `IOException`인지 `BmcException`인지 구분이 안 되는 것이다.

그래서 **원본 예외는 그대로 던지고, 예외 래핑은 fallback에서 한다.**

```java
private String uploadFallback(String contents, byte[] data, Exception e) {
    meterRegistry.counter("oracle.objectstorage.qr.upload.failed",
            "error", e.getClass().getSimpleName()).increment();

    if (e instanceof CallNotPermittedException) {
        log.warn("서킷 브레이커 OPEN 상태 - Oracle Storage 호출 차단됨: contents={}", contents);
        throw new StorageServiceException(RoomErrorCode.QR_CODE_UPLOAD_FAILED,
                "스토리지 서비스가 일시적으로 사용 불가능합니다. 잠시 후 다시 시도해주세요.");
    }

    log.error("Oracle Object Storage QR 코드 업로드 실패: contents={}, error={}",
            contents, e.getMessage(), e);
    throw new StorageServiceException(RoomErrorCode.QR_CODE_UPLOAD_FAILED,
            "QR 코드 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.", e);
}
```

fallback에서 `CallNotPermittedException`을 분기한 이유는, 서킷이 OPEN일 때와 실제 호출이 실패했을 때의 로그 레벨과 메시지를 다르게 하기 위해서다. 서킷이 열려서 차단된 건 예상된 동작이니 `warn`이고, 실제 업로드 실패는 `error`다.

### 호출 흐름 정리

전체 흐름을 정리하면 이렇다.

```
RoomService.createRoom()
  |
  v
QrCodeService.generateQrCodeAsync()  (@Async)
  |
  v
OracleObjectStorageService.upload()
  |
  v
[CircuitBreaker: oracleStorage]
  |
  +-- OPEN
  |     |
  |     v
  |   uploadFallback()
  |     -> "service temporarily unavailable" exception
  |     -> QrCodeService broadcasts ERROR status
  |
  +-- CLOSED / HALF_OPEN
        |
        v
      [Retry: oracleStorage]
        |
        +-- 1st attempt SUCCESS
        |     -> return QR code URL
        |     -> QrCodeService broadcasts SUCCESS
        |
        +-- 1st attempt FAIL --> wait 500ms --> 2nd attempt
              |
              +-- SUCCESS: return URL
              |
              +-- FAIL: uploadFallback()
                    -> record failure metric
                    -> record failure to CircuitBreaker
                    -> QrCodeService broadcasts ERROR
```

## 테스트

### 단위 테스트와 통합 테스트를 나눈 이유

서킷 브레이커 테스트는 두 가지 레벨로 작성했다.

**단위 테스트**는 Resilience4j API를 직접 사용해서 서킷 브레이커와 리트라이의 동작을 검증한다. Spring 컨텍스트 없이 순수하게 Resilience4j 로직만 테스트한다. 서킷 상태 전이, 리트라이 횟수, 예외별 동작 같은 핵심 로직을 빠르게 검증할 수 있다.

**통합 테스트**는 실제 Spring 컨텍스트에서 `@CircuitBreaker`, `@Retry` 어노테이션이 AOP 프록시를 통해 정상 동작하는지 검증한다. 어노테이션 기반이라 프록시가 안 타면 아무 의미가 없기 때문에, 이 부분은 통합 테스트로 검증해야 했다.

통합 테스트에서 한 가지 주의할 점이 있었다. `OracleObjectStorageService`에 `@Profile("!local & !test")` 조건이 걸려 있어서, 테스트 프로필에서는 이 빈이 로드되지 않는다. 그래서 `@TestConfiguration`으로 수동 등록했다.

```java
@TestConfiguration
static class TestConfig {
    @Bean
    @Primary
    public OracleObjectStorageService oracleObjectStorageService(
            ObjectStorage objectStorage,
            OracleObjectStorageProperties oracleProperties,
            QrProperties qrProperties,
            MeterRegistry meterRegistry
    ) {
        return new OracleObjectStorageService(
            objectStorage, oracleProperties, qrProperties, meterRegistry);
    }
}
```

### 핵심 테스트 케이스

통합 테스트에서 가장 중요한 건 "리트라이 실패 후 fallback이 `StorageServiceException`을 던지는가"다.

```java
@Test
@DisplayName("재시도 횟수를 초과하는 지속적인 실패 발생 시, fallback이 StorageServiceException을 던진다")
void 지속적_실패_시_StorageServiceException_발생() {
    when(objectStorage.putObject(any(PutObjectRequest.class)))
            .thenThrow(new BmcException(500, "ServiceCode", "Persistent failure", "requestId"));

    assertThatThrownBy(() ->
        oracleObjectStorageService.upload("test-contents", "test-data".getBytes()))
            .isInstanceOf(StorageServiceException.class)
            .hasMessageContaining("QR 코드 업로드에 실패했습니다");

    // maxAttempts(2)만큼 호출됨
    verify(objectStorage, times(2)).putObject(any(PutObjectRequest.class));
}
```

이 테스트가 검증하는 건 세 가지다. 리트라이가 maxAttempts(2)만큼 동작했는지, fallback이 실행됐는지, 최종 예외 타입이 `StorageServiceException`인지.

단위 테스트에서는 `@CircuitBreaker` 어노테이션의 fallback이 동작하지 않기 때문에, 이 테스트는 통합 테스트에서만 가능하다. 어노테이션 기반 AOP는 Spring 프록시를 통해서만 동작하기 때문이다.

## 모니터링

서킷 브레이커를 도입했으면 모니터링이 되어야 한다. 서킷 상태를 모르면 도입한 의미가 없다.

Actuator 엔드포인트에 `circuitbreakers`와 `retries`를 노출시켰다.

```yaml
management:
  endpoints:
    web:
      exposure:
        include: "health,info,metrics,prometheus,circuitbreakers,retries"
```

Prometheus 메트릭도 자동 수집된다. Resilience4j가 Micrometer와 통합되어 있어서, 서킷 브레이커 상태 전이, 실패율, 호출 횟수 등이 자동으로 메트릭에 잡힌다. 여기에 추가로 업로드 성공/실패를 커스텀 메트릭으로 기록해서 Grafana 대시보드에서 확인할 수 있게 했다.

## 핵심 포인트

- **Retry**: 일시적 장애를 복구한다. 단, 모든 예외에 재시도하면 안 된다. retryExceptions로 재시도 대상을 명확히 제한해야 한다.
- **Circuit Breaker**: 지속적 장애에서 리소스를 보호한다. slidingWindowSize와 failureRateThreshold는 서비스의 트래픽 패턴에 맞게 설정해야 한다.
- **aspect-order**: CircuitBreaker가 Retry보다 바깥에 있어야 한다. 서킷이 열린 상태에서 무의미한 재시도를 방지한다.
- **예외 래핑은 fallback에서**: 원본 예외를 그대로 던져야 Resilience4j가 예외 타입을 정확히 판단할 수 있다. 래핑은 fallback 한 곳에서 처리한다.
- **단위 테스트 + 통합 테스트**: Resilience4j 로직은 단위 테스트로, 어노테이션 기반 AOP 동작은 통합 테스트로 검증한다. 둘 다 필요하다.