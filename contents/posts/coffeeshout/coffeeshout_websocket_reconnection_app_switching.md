---
title: WebSocket Reconnection on App Switching
date: 2025-08-13 09:44:21
updated: 2025-08-21 22:10:05
publish: true
tags:
  - 우아한테크코스
  - CoffeeShout
series: 커피빵(CoffeeShout) 개발록
---
## 문제 상황
mvp를 빠르게 만들고 테스트를 하던 중, **다른 앱을 사용하다가 다시 돌아오면 웹소켓 통신이 안된다**는 것을 발견했다.

찾아보니 모바일이든 pc의 각각의 기기에서 앱을 전환할 때 환경에 맞게 백그라운드에서 웹소켓을 유지하는 시간이 달랐고, 테스트를 결과 아이폰이나 맥북 기준 대부분 4~5초이내로 연결이 중단되는 것 같다.

또 클라이언트 코드에서도 백그라운드 감지 로직이 없어서, OS에 의해 웹소켓이 연결 해제되면 감지조차 못했다.

서버에서도 이렇게 연결이 끊어지고 구독이 해제되면, `SimpleBrokerMessageHandler`의 `SubscriptionRegistry`에 저장되어있던 구독정보가 자동으로 제거되기 때문에 서버가 클라이언트에게 메시지를 보낼 수 없게 된다.

또 문제는 그렇게 재연결을 하려고 할 때 사용되는 세션 id가 기존에 사용하던 id가 아니어서 서버에서는 다른 세션 id이지만, 기존에 있던 사용자인지 알 수 있어야했다.

## 요구사항
앱 전환 시에도 사용자는 안정적으로 서비스를 이용할 수 있어야한다.
### 세부 요구사항
- 클라이언트는 서비스의 백 -> 포그라운드 전환을 감지해서 연결을 재요청해줘야한다.
- 서버는 다른 세션id를 들고 오는 클라이언트를 보고, 기존의 플레이어와 연동해줘야한다.

## 전처리
### 사용자와 player를 어떻게 관리할까?
현재 우리 서비스에서는 player를 구분할 수 있는 id인 고유식별자가 존재하지 않는다. DB를 사용하고 있지도 않고, player끼리의 구분이 필요한 상황이 없어서 id를 도입하지 않았다.

대신 `joinCode:playerName`의 형식으로 room의 joinCode와 player의 playerName을 합성키처럼 활용했다. 그리고 웹소켓 연결시에 필요한 `sessionId`도 관리를 해주고 있어야 연결 재요청시에 해당 사용자가 기존 플레이어인지 구분을 할 수 있었다.

```java
// 플레이어 세션 매핑 관리  
private final ConcurrentHashMap<String, String> playerSessionMap; // "joinCode:playerName" -> sessionId  
private final ConcurrentHashMap<String, String> sessionPlayerMap; // sessionId -> "joinCode:playerName"
```

### Disconnect가 감지되면?
우선 서버에서 가장 먼저 서버에서 해줘야했던 건 Disconnect가 감지되면 room에서 해당 player를 제거해줘야했다. 그 사용자가 Disconnect 되어도 해당 room에 있던 다른 사용자들은 서비스를 계속 이용할 수 있어야했기에, Disconnect된 player 감지 및 제거가 필수였다.

웹소켓 연결이 끊어지면 클라이언트로부터 Disconnect 메시지가 온다. 이를 서버가 받을 수 있는데, 이와 같은 메시지를 받는 과정은 [[how_spring_handle_websocket]]를 참고하면 좋다!

**'서버에서 Disconnect를 감지하면, 어느 단계에서 player를 room에서 지워줘야할까?'를 많이 고민했다.** 그 과정에서 웹소켓을 구현한 Spring의 내부 구조를 많이 고민하고 실험을 했었는데, 지금까지 연결해제와 관련해서 정리된 내용은 아래와 같다!
```
클라이언트가 DISCONNECT 프레임 전송
	↓ 
PreSend 인터셉터 실행 (DISCONNECT 메시지 처리 전)
	↓ 
메시지 브로커가 DISCONNECT 프레임 처리 (라우팅은 없고 연결 종료 준비)
	↓ 
PostSend 인터셉터 실행 (DISCONNECT 메시지 처리 후)
	↓ 
TCP WebSocket 연결 종료
	↓ 
SubProtocolWebSocketHandler.afterConnectionClosed() ← WebSocket 레벨
	↓ 
clearSession() 호출
	↓ 
StompSubProtocolHandler.afterSessionEnded() ← STOMP 프로토콜 레벨
	↓ 
SessionDisconnectEvent 발행 
```
이중에서 처음에는 postSend에서 player 제거를 구현했었다. 하지만 Interceptor의 주목적에 맞게 사용하는 것도 아니었고, Spring에서 tcp 소켓 연결 해제를 판단하는 시점보다 빨라서 정합성이 깨질 수도 있을 거라 생각했다. 또한 얼마전에 브라우저가 강제종료 됐을 때 클라이언트가 Disconnect 프레임을 전송하지도 못하고 바로 tcp 연결이 끊기면서 room에서 player가 제거되지 않는 문제도 발견했다. 

그래서 좀 더 살펴보니, Spring 내부에서 완전히 tcp 소켓이 끊어지면, STOMP 연결해제를 감지하고 자동으로 SessionDisconnectEvent을 발행해주고 있었고,  이를 잡아서 room에서 player를 지워주는 게 더 적절한 시점에 처리하는 것이라고 판단했다.

## 첫 번째 시도, 클라이언트 코드에서만 재연결을 추가해주면?
서버에서는 위에서 말한 것처럼 Disconnect가 감지되면 바로 room에서 player를 지워줬다.

클라이언트 코드에서는 Page Visibility API를 사용해서 사용 중이던 서비스가 백그라운드에서 포그라운도 전환됐을 때를 감지해서 그 시점에 클라이언트가 서버로 웹소켓 연결을 재요청하도록 추가했다.

서버에서는 연결 요청시에 오는 메시지의 헤더에 담긴 joinCode와 playerName을 보고 적절한 room을 찾아서 다시 player 객체를 만들어서 추가시켜줬다.

### 뭔가 어색하다.
잘 작동하긴 했다. 하지만 좀 어색하게 느껴졌던 건, 사용자가 앱 전환을 하자마자 room에서 player가 사라지는 모습이었다. 

다른 여타 비슷한 류의 게임을 살펴보면, 배틀그라운드든, 오버워치든, 텐텐이든 사용자가 앱 전환을 했을 때 바로 튕기게끔 하는 게 아니라 조금의 유예 시간을 주고, 그래도 사용자가 돌아오지 않았을 때 나가게 처리하는 모습을 볼 수 있었다.

우리 서비스도 참고해보려고 했다.
## 두 번째 시도, 15초의 유예 시간을 주자
사용자의 Disconnect가 감지되면 조금의 유예 시간을 주도록 했다. joinCode를 다른 서비스에 공유하러 나가거나, 급한 알림을 확인하는 등의 상황을 고려했다. 그렇게 15초의 여유 시간을 줬고, 그 시간 안에도 서비스로 안돌아오면 room에서 player를 제거해주었다.

이를 구현하기 위해 ScheduledFuture를 이용했다.
```java
public void schedulePlayerRemoval(String playerKey, String sessionId, String reason) {  
    log.info("플레이어 지연 삭제 스케줄링: playerKey={}, sessionId={}, delay={}초",  
            playerKey, sessionId, REMOVAL_DELAY.getSeconds());  
  
    // disconnect 된 플레이어는 ready 상태 false로 변경  
    playerDisconnectionService.cancelReady(playerKey);  
  
    // 새로운 스케줄 등록  
    final ScheduledFuture<?> future = taskScheduler.schedule(  
            () -> {  
                executePlayerRemoval(playerKey, sessionId, reason);  
                stompSessionManager.removeSession(sessionId);  
            },  
            Instant.now().plus(REMOVAL_DELAY)  
    );  
  
    scheduledTasks.put(playerKey, future);  
}
```

그래서 잠시 앱을 전환하더라도 room에는 player가 남아있고, 대신 그렇게 잠시 나가있을 땐 host가 게임을 시작하지 못하도록 해줬다.

## TODO
웹소켓은 네트워크 연결 방식이 바뀔 때도 연결이 끊기고, 새로운 세션id가 발급된다. 이런 상황은 앱 전환과 다르게 사용자가 컨트롤하지 못하는 상황도 있을거라 생각이 들어서 이 이슈도 우선적으로 해결해야할 것 같다.

이 문제를 해결하면서, 게임 중에 연결이 끊기는 경우 게임시간을 어떻게 다시 전파해야할지, 끊긴 과정에서 못받은 메시지들은 어떻게 다시 전달해줘야할지 고민할 수 있을 것 같다.