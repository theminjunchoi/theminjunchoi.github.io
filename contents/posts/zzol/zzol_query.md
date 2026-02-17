---
title: 쿼리 최적화, 36초를 1초로 줄이기까지
date: 2026-02-5 09:44:21
updated: 2026-02-17 18:44:28
publish: true
tags:
  - ZZOL
series: ZZOL 개발록
---
우테코 프로젝트 `ZZOL(구 커피빵)`에서 대시보드 API 성능 개선 작업을 했다. 레이싱 게임 TOP 플레이어 조회 API가 너무 느려서 원인을 파악하고 개선하는 과정을 기록해본다.

## 문제 상황

dev 환경에 데이터를 넣고 API를 호출해보니 응답이 너무 느렸다. `EXPLAIN ANALYZE`로 쿼리 실행 계획을 확인해봤다.

```
-> Table scan on mg (cost=20588 rows=199800) (actual time=0.238..463 rows=200000 loops=1)
-> Aggregate using temporary table (actual time=34947..34947 rows=599999 loops=1)
```

문제는 두 가지였다.

1. `mini_game_play` 테이블 풀스캔 (20만 건)
2. 60만 건짜리 임시 테이블 생성 후 정렬

120만 건 데이터에서 3개 테이블 JOIN하고 있으니 당연히 느릴 수밖에 없었다.

## 최적화 전 쿼리 흐름

```
mini_game_result (120만 건)
    ↓
JOIN mini_game_play (20만 건 풀스캔)
    ↓
JOIN player (60만 건)
    ↓
GROUP BY + ORDER BY (임시 테이블 60만 건)
    ↓
LIMIT 5
```

**실행 시간: 36,050ms (36초)**

## 적용한 최적화

### 1. 비정규화

`mini_game_type`을 `mini_game_result` 테이블에 중복 저장했다.

```sql
-- Before: JOIN 필요
SELECT ... FROM mini_game_result mr
JOIN mini_game_play mg ON mr.mini_game_play_id = mg.id
WHERE mg.mini_game_type = 'RACING_GAME'

-- After: JOIN 제거
SELECT ... FROM mini_game_result mr
WHERE mr.mini_game_type = 'RACING_GAME'
```

**왜 비정규화를 선택했는가?**

무조건 비정규화가 답은 아니라고 생각했다. 도메인 특성과 데이터 분포를 분석하고 나서 결정했다.

첫째, **mini_game_type은 변경되지 않는 값이다.** 한 번 생성된 미니게임의 타입은 절대 바뀌지 않는다. 레이싱 게임이 카드 게임으로 바뀌는 일은 없다. 비정규화의 가장 큰 단점은 데이터 정합성 관리인데, 변경이 없는 값이라면 이 문제가 사라진다.

둘째, **mini_game_type의 카디널리티가 낮다.** 현재 게임 타입은 `RACING_GAME`, `CARD_GAME` 두 가지뿐이다. 새로운 게임 타입이 추가되더라도 수십 개 수준일 것이다. 이런 경우 중복 저장해도 저장 공간 증가가 미미하다. varchar(20) × 120만 건 = 약 20MB 정도.

셋째, **조회 빈도가 압도적으로 높다.** 대시보드 API는 관리자가 수시로 호출하는 조회성 API다. 반면 mini_game_result 데이터는 게임이 끝날 때 한 번 INSERT되고 끝이다. 조회 100번에 쓰기 1번 수준이라면, 조회 성능을 위해 쓰기 시 약간의 오버헤드를 감수하는 게 합리적이다.

넷째, **JOIN 제거 효과가 크다.** 기존 쿼리는 `mini_game_play` 테이블을 풀스캔해서 `mini_game_type`을 가져왔다. 20만 건 풀스캔 후 필터링. 비정규화하면 이 JOIN 자체가 사라지고, `mini_game_result` 테이블 하나에서 바로 필터링할 수 있다.

### 2. 복합 인덱스 추가

```sql
CREATE INDEX idx_mini_game_result_type_created 
ON mini_game_result (mini_game_type, created_at);
```

**왜 복합 인덱스인가?**

단일 컬럼 인덱스가 아니라 복합 인덱스를 선택한 이유가 있다.
대시보드 API의 쿼리 조건을 보면 항상 두 가지 조건이 함께 쓰인다.

```sql
WHERE mini_game_type = 'RACING_GAME'
  AND created_at BETWEEN '2026-01-01' AND '2026-01-31'
```

`mini_game_type` 단일 인덱스만 있으면? RACING_GAME 60만 건을 먼저 찾고, 그 안에서 created_at 조건으로 다시 필터링해야 한다.

`created_at` 단일 인덱스만 있으면? 이번 달 데이터 12만 건을 먼저 찾고, 그 안에서 mini_game_type으로 다시 필터링해야 한다.

복합 인덱스 `(mini_game_type, created_at)`가 있으면? B-Tree에서 RACING_GAME이면서 이번 달인 데이터를 **한 번에** 찾는다. 6만 건만 정확히 읽으면 된다.

**컬럼 순서도 중요하다.** `mini_game_type`을 앞에 둔 이유는 등호(=) 조건이기 때문이다. `created_at`은 범위(BETWEEN) 조건이다. 등호 조건 → 범위 조건 순서로 인덱스를 구성해야 효율적으로 탄다. 반대로 하면 범위 조건에서 인덱스 스캔이 끊긴다.

## 최적화 후 쿼리 흐름

```
mini_game_result (인덱스 레인지 스캔 → 6만 건만 조회)
    ↓
JOIN player (PK lookup)
    ↓
GROUP BY + ORDER BY (임시 테이블 6만 건)
    ↓
LIMIT 5
```

**실행 시간: 1,173ms (1.2초)**

## Before vs After

|항목|Before|After|개선율|
|---|---|---|---|
|실행 시간|36,050ms|1,173ms|**96.7%**|
|JOIN 수|3개|2개|33% 감소|
|스캔 방식|풀스캔 (120만 건)|인덱스 레인지 스캔 (6만 건)|-|
|임시 테이블|60만 건|6만 건|90% 감소|

## 삽질했던 부분

### 1. k6 부하 테스트 결과가 이상했다

Before/After 모두 5~6ms로 차이가 없었다. 알고 보니 InnoDB 버퍼풀 캐시 히트 때문이었다. 같은 쿼리 반복하면 메모리에서 읽어서 빠르게 응답함.

→ 진짜 성능은 `EXPLAIN ANALYZE`로 측정한 콜드 쿼리 시간으로 비교해야 했다.

### 2. 인덱스를 만들어도 안 탔다

처음에 데이터를 전부 이번 달(1월)에 몰아넣었더니 인덱스를 만들어도 옵티마이저가 풀스캔을 선택했다. "어차피 다 읽어야 하니까 풀스캔이 낫다"고 판단한 것.

→ 데이터 분포를 1년치로 분산시키고 이번 달은 10%만 넣어서 해결했다. `ANALYZE TABLE`로 통계 정보 갱신도 필요했다.

## 핵심 포인트

- **비정규화**: 무조건 답이 아니다. 변경 가능성, 카디널리티, 조회/쓰기 비율을 따져보고 결정해야 한다.
- **복합 인덱스**: WHERE 조건에 자주 함께 쓰이는 컬럼 조합으로 생성. 등호 조건 → 범위 조건 순서로.
- **EXPLAIN ANALYZE**: 병목 구간이 어디인지 실제 실행 시간으로 확인 가능.
- **데이터 분포**: 테스트 데이터도 실제 운영 환경과 유사하게 구성해야 의미 있는 결과가 나온다.

