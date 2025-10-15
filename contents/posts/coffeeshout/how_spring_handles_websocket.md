---
title: How Spring Handles WebSocket
date: 2025-08-12 09:44:21
updated: 2025-10-15 09:46:55
publish: true
tags:
  - spring
  - CoffeeShout
series: 커피빵(CoffeeShout) 개발록
---
[[how_spring_injects_httpsession]] 이 포스트를 읽고 오면 이해가 더 잘 됩니다!

Spring에서 어떻게 WebSocket 연결을 수립할까? 그 과정을 찾아가보자.

## Spring에서 연결방식을 WebSocket으로 업그레이드 하는 방법
```
HTTP Request (GET /ws) 
	↓ 
DispatcherServlet.doService() 
	↓ 
DispatcherServlet.doDispatch() 
	↓ 
HandlerMapping.getHandler() (여기서 WebSocketHandlerMapping 사용) 
	↓ 
HandlerAdapter.handle() (여기서 HttpRequestHandlerAdapter 사용) 
	↓ 
WebSocketHttpRequestHandler.handleRequest() 
	↓ 
DefaultHandshakeHandler.doHandshake()
	↓ 
RequestUpgradeStrategy.upgrade() (HTTP 연결이 WebSocket 연결로 업그레이드)
	↓
DispatcherServlet 완전히 빠짐
	↓ 
이후 모든 메시지는 WebSocket 핸들러가 직접처리
```

### handshake 성공 후에는?
- 물리적 TCP 연결은 동일함
- 메시지들은 DispatcherServlet을 안거쳐감
- Tomcat/Jetty가 직접 WebSocket 핸들러로 라우팅
- Spring WebSocket 인프라가 직접 처리
### 흐름 비교
#### HTTP 요청
```
TCP → Tomcat → DispatcherServlet → Controller → 응답 
```
#### WebSocket 메시지 (handshake 성공 후)
```
TCP → Tomcat WebSocket Container → SubProtocolWebSocketHandler → ChannelInterceptor → @MessageMapping
```

## 클라이언트에서 서버로
```
WebSocket Frame (STOMP CONNECT)
    ↓
SubProtocolWebSocketHandler.handleMessage() (서블릿 컨테이너가 호출함)
    ↓  
StompSubProtocolHandler.handleMessageFromClient()
    ↓
clientInboundChannel로 Spring Message 전송
    ↓
ChannelInterceptor (커스텀한 인터셉터가 여기서 동작!)
    ↓
SimpleBroker 또는 외부 브로커
    ↓
@MessageMapping 컨트롤러 (전후로 presend, postsend)
```

### SubProtocolWebSocketHandler.handleMessage() 호출
```java

@Override  
public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {  

	// 세션 갖고오기
    WebSocketSessionHolder holder = this.sessions.get(session.getId());  
    if (holder != null) {  
       session = holder.getSession();  
    }  
    
    // 프로토콜 핸들러 찾기 (STOMP, etc, ...)
    SubProtocolHandler protocolHandler = findProtocolHandler(session);  

	// 위임하기
    protocolHandler.handleMessageFromClient(session, message, this.clientInboundChannel);  
    if (holder != null) {  
       holder.setHasHandledMessages();  
    }  
}
```
### StompSubProtocolHandler.handleMessageFromClient() 호출

```java
@Override  
public void handleMessageFromClient(WebSocketSession session,  
       WebSocketMessage<?> webSocketMessage, MessageChannel targetChannel) {  
  
    /* 위에서 생략된 내용들
    1. WebSocket 메시지 -> ByteBuffer로 변환
    2. STOMP 프레임 디코딩
    3. 순서 보장처리 (하나의 메시지가 프레임단위로 쪼개져서 올 수도 있음)
    */

	// 4. 각 STOMP 메시지별 처리
    for (Message<byte[]> message : messages) {  
       StompHeaderAccessor headerAccessor =  
             MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);  

       StompCommand command = headerAccessor.getCommand();  
       boolean isConnect = StompCommand.CONNECT.equals(command) || StompCommand.STOMP.equals(command);  
  
       boolean sent = false;  
       try {  
		  // 5. 세션 정보를 Spring Message 헤더에 설정
          headerAccessor.setSessionId(session.getId());  
          headerAccessor.setSessionAttributes(session.getAttributes());  
          headerAccessor.setUser(getUser(session));  
          if (isConnect) {  
             headerAccessor.setUserChangeCallback(user -> {  
                if (user != null && user != session.getPrincipal()) {  
                   this.stompAuthentications.put(session.getId(), user);  
                }  
             });  
          }  
          headerAccessor.setHeader(SimpMessageHeaderAccessor.HEART_BEAT_HEADER, headerAccessor.getHeartbeat());  
          
          try {  
            // 여기서 clientInboudChannel로 전송! 
            // → channelToUse.send()
            // → AbstractMessageChannel.send() 
            // → ChannelInterceptorChain.applyPreSend() 
            // → ChannelInterceptor.preSend() 호출됨! (Custom)
            // → 실제메시지 처리 (@MessageMapping)
            // → SimpleBrokerMessageHandler의 SubscriptionRegistry에 구독정보 저장
            // → ChannelInterceptorChain.applyPostSend()
            // → ChannelIntercaptor.postSend() 호출됨 (Custom)
	         SimpAttributesContextHolder.setAttributesFromMessage(message); 
             sent = channelToUse.send(message);  
  
             if (sent) {  
                if (this.eventPublisher != null) {  
                   Principal user = getUser(session);  
                   if (isConnect) {  
                      publishEvent(this.eventPublisher, new SessionConnectEvent(this, message, user));  
                   }  
                   else if (StompCommand.SUBSCRIBE.equals(command)) {  
                      publishEvent(this.eventPublisher, new SessionSubscribeEvent(this, message, user));  
                   }  
                   else if (StompCommand.UNSUBSCRIBE.equals(command)) {  
                      publishEvent(this.eventPublisher, new SessionUnsubscribeEvent(this, message, user));  
                   }  
                }  
             }  
          }  
          finally {  
             SimpAttributesContextHolder.resetAttributes();  
          }  
       }  
}
```

## 서버에서 클라이언트로!
```
@Controller에서 SimpMessagingTemplate.send()
    ↓
clientOutboundChannel로 메시지 전송
	↓
SimpleBroker 또는 외부 브로커
    ↓
SubProtocolWebSocketHandler.handleMessage()
    ↓
StompSubProtocolHandler.handleMessageToClient()
    ↓
WebSocket Frame으로 변환해서 클라이언트 전송 (Tomcat/Jetty에서)
```
### @Controller에서 SimpMessagingTemplate.send()
```java
@MessageMapping("/room/{joinCode}/update-players")  
public void broadcastPlayers(@DestinationVariable String joinCode) {  
    final List<PlayerResponse> responses = roomService.getAllPlayers(joinCode)  
            .stream()  
            .map(PlayerResponse::from)  
            .toList();  
  
    messagingTemplate.convertAndSend("/topic/room/" + joinCode,  
            WebSocketResponse.success(responses));  
}
```
### SimpMessagingTemplate 내부동작
```java
@Override  
public void convertAndSend(D destination, Object payload, @Nullable Map<String, Object> headers,  
       @Nullable MessagePostProcessor postProcessor) throws MessagingException {  
  
    Message<?> message = doConvert(payload, headers, postProcessor);  
    send(destination, message);  
}

// send -> ... -> AbstractMessageChannel.send()
@Override  
public final boolean send(Message<?> message, long timeout) {  
    Assert.notNull(message, "Message must not be null");  
    Message<?> messageToUse = message;  
    ChannelInterceptorChain chain = new ChannelInterceptorChain();  
    boolean sent = false;  
    try {  

		// 커스텀한 interceptor의 presend 호출
       messageToUse = chain.applyPreSend(messageToUse, this);  
       if (messageToUse == null) {  
          return false;  
       }  
       
		// 등록된 모든 MessageHandler들에게 메시지 전달
		// SubProtocolWebSocketHandler.handleMessage 호출됨
       sent = sendInternal(messageToUse, timeout);

		// 커스텀한 interceptor의 postsend 호출
       chain.applyPostSend(messageToUse, this, sent);  
       chain.triggerAfterSendCompletion(messageToUse, this, sent, null);  
       return sent;  
    }  
    catch (Exception ex) {  
       chain.triggerAfterSendCompletion(messageToUse, this, sent, ex);  
       if (ex instanceof MessagingException messagingException) {  
          throw messagingException;  
       }  
       throw new MessageDeliveryException(messageToUse,"Failed to send message to " + this, ex);  
    }  
    catch (Throwable err) {  
       MessageDeliveryException ex2 =  
             new MessageDeliveryException(messageToUse, "Failed to send message to " + this, err);  
       chain.triggerAfterSendCompletion(messageToUse, this, sent, ex2);  
       throw ex2;  
    }  
}
```
### SubProtocolWebSocketHandler.handleMessage() 호출
```java
@Override  
public void handleMessage(Message<?> message) throws MessagingException {  

	// 1. 메시지에서 세션 id 추출
    String sessionId = resolveSessionId(message);  
    if (sessionId == null) {  
       if (logger.isErrorEnabled()) {  
          logger.error("Could not find session id in " + message);  
       }  
       return;  
    }  

	// 2. 해당 세션 찾기
    WebSocketSessionHolder holder = this.sessions.get(sessionId);  
    if (holder == null) {  
       if (logger.isDebugEnabled()) {  
          // The broker may not have removed the session yet  
          logger.debug("No session for " + message);  
       }  
       return;  
    }  
  
    WebSocketSession session = holder.getSession();  
    try {  
      // 3. 프로토콜 핸들러로 클라이언트에게 전송
     findProtocolHandler(session).handleMessageToClient(session, message);  
    }  
    catch (SessionLimitExceededException ex) {  
       try {  
          if (logger.isDebugEnabled()) {  
             logger.debug("Terminating '" + session + "'", ex);  
          }  
          else if (logger.isWarnEnabled()) {  
             logger.warn("Terminating '" + session + "': " + ex.getMessage());  
          }  
          this.stats.incrementLimitExceededCount();  
          clearSession(session, ex.getStatus()); // clear first, session may be unresponsive  
          session.close(ex.getStatus());  
       }  
       catch (Exception secondException) {  
          logger.debug("Failure while closing session " + sessionId + ".", secondException);  
       }  
    }  
    catch (Exception ex) {  
       // Could be part of normal workflow (for example, browser tab closed)  
       if (logger.isDebugEnabled()) {  
          logger.debug("Failed to send message to client in " + session + ": " + message, ex);  
       }  
    }  
}
```
### StompSubProtocolHandler.handleMessageToClient() (실제 전송)
```java
@Override  
@SuppressWarnings("unchecked")  
public void handleMessageToClient(WebSocketSession session, Message<?> message) {  
    // ... 생략
    
    // 순서 보장
    Runnable task = OrderedMessageChannelDecorator.getNextMessageTask(message);  
    if (task != null) {  
       Assert.isInstanceOf(ConcurrentWebSocketSessionDecorator.class, session);  
       ((ConcurrentWebSocketSessionDecorator) session).setMessageCallback(m -> task.run());  
    }  

	// 실제 클라이언트에게 전송
    sendToClient(session, accessor, payload);  
}

```

```java
private void sendToClient(WebSocketSession session, StompHeaderAccessor stompAccessor, byte[] payload) {  
    StompCommand command = stompAccessor.getCommand();  
    try {  
       byte[] bytes = this.stompEncoder.encode(stompAccessor.getMessageHeaders(), payload);  
       boolean useBinary = (payload.length > 0 && !(session instanceof SockJsSession) &&  
             MimeTypeUtils.APPLICATION_OCTET_STREAM.isCompatibleWith(stompAccessor.getContentType()));  
	    // Tomcat/Jetty 컨테이너로 전달
       if (useBinary) {  
          session.sendMessage(new BinaryMessage(bytes));  
       }  
       else {  
          session.sendMessage(new TextMessage(bytes));  
       }  
    }  
    catch (SessionLimitExceededException ex) {  
       // Bad session, just get out  
       throw ex;  
    }  
    catch (Throwable ex) {  
       // Could be part of normal workflow (for example, browser tab closed)  
       if (logger.isDebugEnabled()) {  
          logger.debug("Failed to send WebSocket message to client in session " + session.getId(), ex);  
       }  
       command = StompCommand.ERROR;  
    }  
    finally {  
       if (StompCommand.ERROR.equals(command)) {  
          try {  
             session.close(CloseStatus.PROTOCOL_ERROR);  
          }  
          catch (IOException ex) {  
             // Ignore  
          }  
       }  
    }  
}
```

## 핵심 포인트
### SubProtocolWebSocketHandler
- **SubProtocolWebSocketHandler**는 **WebSocket ↔ Spring Messaging 브릿지 역할**을 하는 핵심 컴포넌트임
- WebSocketHandler 구현
	- WebSocket 컨테이너(Tomcat/Jetty)에서 호출
	- **클라이언트 → 서버** 메시지 처리
	- **WebSocketMessage → Spring Message** 변환
- MessageHandler 구현
	- **clientOutboundChannel**에 구독자로 등록됨
	- **서버 → 클라이언트** 메시지 처리
	- **Spring Message → WebSocket 프레임** 변환하도록 Tomcat/Jetty 호출

### ChannelInterceptor의 Presend/PostSend
- Input 메시지 (clientInboundChannel):
	- preSend → @MessageMapping 실행 → postSend
- Output 메시지 (clientOutboundChannel, 컨트롤러에서 전송):
	- preSend → 클라이언트 전송 → postSend
- 그래서 채팅 하나 보내면 inbound 채널에서 preSend/postSend 한 번, outbound 채널에서 preSend/postSend 또 한 번 실행됨