---
title: Understanding DispatcherServlet in Spring MVC
date: 2025-04-15 09:44:21
updated: 2025-04-19 17:21:23
publish: true
tags:
  - spring
series: 
---


## DispatcherServlet

[공식문서](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html)에 따르면, Spring MVC는 다른 많은 웹 프레임워크들과 마찬가지로 Front Controller Pattern에 기반을 두고 있다.

우선 여기서 말하는 **Front Controller Pattern은 뭘까?** 이는 어플리케이션에서 들어오는 모든 요청을 하나의 진입점으로 모아서 처리하는 설계 방식이다. 좀 더 자세히 설명하면, 로그인은 LoginServlet에서, 회원가입은 SignupServlet에서 처리하는 게 아니라 공통된 모듈에서 처리해주는 설계방식이다. 

그럼 다시 **Servlet은 뭘까?** Servlet은 웹 요청을 받아 동적인 웹 페이지나 데이터를 만들어주는 역할을 하는 객체인데, 자바로 만든 서버측 컴포넌트 정도로 이해하고 넘어가려한다.

**DispatcherServlet도 이 Servlet을 상속해서 만들어진 것으로, 여기서 모든 요청을 받아주고 있다.** 이후 실제 처리는 여러 delegate component들이 나누어 담당하고 있다. 

delegate components
- Handler Mapping
- Handler Adapter
- View Resolver
- Exception Handler
- etc...

## Spring MVC's Internal Request Handling Flow
1. DispatcherServlet이 클라이언트로부터 Request를 받는다.
2. HandlerMapping을 통해 Request 정보에 대한 알맞은 Controller를 찾는다.
3. Request를 Controller로 건내줄 수 있는 HandlerAdapter를 찾아서 건내준다.
4. HandlerAdapter를 통해 Controller 메서드를 호출한다.
5. 반환값(Response)을 HandlerAdapter에게 건내준다.
6. 반환값에 따라 ResponseEntity로 감싸는 경우가 있고, 이 형식에 따라 다른 Converter가 동작한다.
	- 반환값이 view 이름인 경우, ViewResolver를 통해 렌더링
	- 반환값이 데이터(json)인 경우, ResponseEntity로 감싸고 HttpMessageConverter가 작동
		- 단순 문자열이면, StringHttpMessageConverter
		- 객체면, MappingJackson2HttpMessageConverter
## Deep Dive to Workflow
![[diagram.png]]
DispatcherServlet은 위와 같은 계층 구조로 이루어져있다. 그래서 각 단계마다 실행되는 메서드의 위치가 다른데, 좀 더 자세히 살펴보자

### 1. DispatcherServlet이 클라이언트로부터 Request를 받는다.
외부에서 들어온 요청은 HttpServlet에서 구현된 service 메서드에서 처리된다. 
```java
public abstract class HttpServlet extends GenericServlet {

	public void service(ServletRequest req, ServletResponse res) throws ServletException, IOException {  
	    HttpServletRequest request;  
	    HttpServletResponse response;  
	    try {  
	        request = (HttpServletRequest)req;  
	        response = (HttpServletResponse)res;  
	    } catch (ClassCastException var6) {  
	        throw new ServletException(lStrings.getString("http.non_http"));  
	    }  
	  
	    this.service(request, response);  
	}
}
```
이 메서드에서는 외부에서 받은 ServletRequest, ServletResponse 객체를 각각 HttpServletRequest, HttpServletResponse 객체로 캐스팅해주고 다시 서비스를 호출해주는데, 이때 호출되는 service 메서드는 다음과 같다.
```java
public abstract class HttpServlet extends GenericServlet {

	protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {  
	    String method = req.getMethod();  
	    if (method.equals("GET")) {  
	        long lastModified = this.getLastModified(req);  
	        if (lastModified == -1L) {  
	            this.doGet(req, resp);  
	        } else {  
	            long ifModifiedSince;  
	            try {  
	                ifModifiedSince = req.getDateHeader("If-Modified-Since");  
	            } catch (IllegalArgumentException var9) {  
	                ifModifiedSince = -1L;  
	            }  
	  
	            if (ifModifiedSince < lastModified / 1000L * 1000L) {  
	                this.maybeSetLastModified(resp, lastModified);  
	                this.doGet(req, resp);  
	            } else {  
	                resp.setStatus(304);  
	            }  
	        }  
	    } else if (method.equals("HEAD")) {  
	        long lastModified = this.getLastModified(req);  
	        this.maybeSetLastModified(resp, lastModified);  
	        this.doHead(req, resp);  
	    } else if (method.equals("POST")) {  
	        this.doPost(req, resp);  
	    } else if (method.equals("PUT")) {  
	        this.doPut(req, resp);  
	    } else if (method.equals("DELETE")) {  
	        this.doDelete(req, resp);  
	    } else if (method.equals("OPTIONS")) {  
	        this.doOptions(req, resp);  
	    } else if (method.equals("TRACE")) {  
	        this.doTrace(req, resp);  
	    } else {  
	        String errMsg = lStrings.getString("http.method_not_implemented");  
	        Object[] errArgs = new Object[1];  
	        errArgs[0] = method;  
	        errMsg = MessageFormat.format(errMsg, errArgs);  
	        resp.sendError(501, errMsg);  
	    }  
	}
}
```
들어오는 Request의 종류에 따라 알맞은 doX 메서드를 각각 호출해주고 있다. 이때 doX 메서드들은 자식 클래스인 FrameworkServlet에서 구현되어있는 것들이 호출된다.

```java
public abstract class FrameworkServlet extends HttpServletBean implements ApplicationContextAware {

	@Override  
	protected final void doGet(HttpServletRequest request, HttpServletResponse response)  
	       throws ServletException, IOException {  
	  
	    processRequest(request, response);  
	}  
	  
	@Override  
	protected final void doPost(HttpServletRequest request, HttpServletResponse response)  
	       throws ServletException, IOException {  
	  
	    processRequest(request, response);  
	}  
	  
	@Override  
	protected final void doPut(HttpServletRequest request, HttpServletResponse response)  
	       throws ServletException, IOException {  
	  
	    processRequest(request, response);  
	}
	// ... 다른 doX 메서드들
}
```
생각보다 각 doX 메서드에서 해주는 게 없었고 processRequest가 Request에 맞게 처리를 해주고 있다.
```java
public abstract class FrameworkServlet extends HttpServletBean implements ApplicationContextAware {

	protected final void processRequest(HttpServletRequest request, HttpServletResponse response)  
       throws ServletException, IOException {  
  
    // ...  
  
	    try {  
	       doService(request, response);  
	    }  
	    catch (ServletException | IOException ex) {  
	       failureCause = ex;  
	       throw ex;  
	    }  
	    catch (Throwable ex) {  
	       failureCause = ex;  
	       throw new ServletException("Request processing failed: " + ex, ex);  
	    }  
	  
	    // ...
	}
}
```
processRequest는 내부에서 doService를 호출하고 있고, 이 메서드는 FrameworkServlet의 자식 클래스인 DispatcherServlet에서 구현되어있다.
```java
public class DispatcherServlet extends FrameworkServlet {
    
    @Override
    protected void doService(HttpServletRequest request, HttpServletResponse response) throws Exception {
        logRequest(request);

        // ...

        try {
            doDispatch(request, response);
        } finally {
            // ...
        }
    }

    // ...

}
```
또 다시 여기서 doDispatch를 호출해주고 있는데 좀 더 자세히 들여다보자.
```java
public class DispatcherServlet extends FrameworkServlet {
    
    protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {  
    HttpServletRequest processedRequest = request;  
    HandlerExecutionChain mappedHandler = null;  
    boolean multipartRequestParsed = false;  
  
    WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);  
  
    try {  
       ModelAndView mv = null;  
       Exception dispatchException = null;  
  
       try {  
          processedRequest = checkMultipart(request);  
          multipartRequestParsed = (processedRequest != request);  
  
          // Determine handler for the current request.  
          mappedHandler = getHandler(processedRequest);  
          if (mappedHandler == null) {  
             noHandlerFound(processedRequest, response);  
             return;  
          }  
  
          // Determine handler adapter for the current request.  
          HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());  
  
          // Process last-modified header, if supported by the handler.  
          String method = request.getMethod();  
          boolean isGet = HttpMethod.GET.matches(method);  
          if (isGet || HttpMethod.HEAD.matches(method)) {  
             long lastModified = ha.getLastModified(request, mappedHandler.getHandler());  
             if (new ServletWebRequest(request, response).checkNotModified(lastModified) && isGet) {  
                return;  
             }  
          }  
  
          if (!mappedHandler.applyPreHandle(processedRequest, response)) {  
             return;  
          }  
  
          // Actually invoke the handler.  
          mv = ha.handle(processedRequest, response, mappedHandler.getHandler());  
  
          if (asyncManager.isConcurrentHandlingStarted()) {  
             return;  
          }  
  
          applyDefaultViewName(processedRequest, mv);  
          mappedHandler.applyPostHandle(processedRequest, response, mv);  
       }  
       catch (Exception ex) {  
          dispatchException = ex;  
       }  
       catch (Throwable err) {  
          // As of 4.3, we're processing Errors thrown from handler methods as well,  
          // making them available for @ExceptionHandler methods and other scenarios.          dispatchException = new ServletException("Handler dispatch failed: " + err, err);  
       }  
       processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);  
    }  
    catch (Exception ex) {  
       triggerAfterCompletion(processedRequest, response, mappedHandler, ex);  
    }  
    catch (Throwable err) {  
       triggerAfterCompletion(processedRequest, response, mappedHandler,  
             new ServletException("Handler processing failed: " + err, err));  
    }  
    finally {  
       if (asyncManager.isConcurrentHandlingStarted()) {  
          // Instead of postHandle and afterCompletion  
          if (mappedHandler != null) {  
             mappedHandler.applyAfterConcurrentHandlingStarted(processedRequest, response);  
          }  
          asyncManager.setMultipartRequestParsed(multipartRequestParsed);  
       }  
       else {  
          // Clean up any resources used by a multipart request.  
          if (multipartRequestParsed || asyncManager.isMultipartRequestParsed()) {  
             cleanupMultipart(processedRequest);  
          }  
       }  
    }  
}
}
```
doDispatch 메서드를 살펴보면 많은 것들을 해주고 있다.

우선 HandlerMapping을 해주고, 이를 처리할 HandlerAdapter를 조회해주고 있다. 이후에 컨트롤러를 찾아 메서드들을 수행한다.
### 2. HandlerMapping을 통해 Request 정보에 대한 알맞은 Controller를 찾는다.
잠깐 되돌아보면, 지금까지 DispatcherServlet은 Request를 받아서 여러 메서드를 거쳐, doDispatch까지 왔다. 이제 DispatchServlet은 개발자가 만들어놓은 컨트롤러 중에서 요청을 처리할  수 컨트롤러를 찾고 해당 객체의 메서드를 호출해야하는데, 이때 컨트롤러를 찾아줄 수 있는 게 HandlerMapping이다.

아래는 위 코드의 일부분을 그대로 가져왔다.
```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {  
	// ...
	
	// Determine handler for the current request.  
	mappedHandler = getHandler(processedRequest);  
	if (mappedHandler == null) {  
		 noHandlerFound(processedRequest, response);  
		 return;  
	} 

	// ...
}

@Nullable  
protected HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception {  
    if (this.handlerMappings != null) {  
       for (HandlerMapping mapping : this.handlerMappings) {  
          HandlerExecutionChain handler = mapping.getHandler(request);  
          if (handler != null) {  
             return handler;  
          }  
       }  
    }  
    return null;  
}
```
이 코드에서는 요청에 맞는 HandlerExecutionChain(mappedHandler)을 찾아주고 있다. 

찾아주는 방법은 다음과 같다. 

RequestMappingHandlerMapping은 @Controller로 어노테이트된 모든 컨트롤러를 찾아서 필드로 관리를 해주고 있다. 이 클래스는 필드로 Map<String, Predicate<>> pathPrefixes를 갖고 있어서, key 값에는 요청 정보, value 값에는 처리할 대상을 관리하고 있다.  

처리할 대상은 컨트롤러와 메서드를 담고 있는 HandlerMethod 객체이며, 요청정보로 Map에서 값을 찾고 반환할 때 HandlerExecutionChain으로 감싸서 넘겨준다.

HandlerExecutionChain은 실제 HTTP 요청을 처리하는 handler(컨트롤러 메서드)와 handler 전후에 인증, 로깅 등을 처리할 수 있는 인터셉터로 이루어진다. 
### 3. Request를 Controller로 건내줄 수 있는 HandlerAdapter를 찾아서 건내준다.
```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {  

	// ...
	
	// Determine handler adapter for the current request.  
	HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());  

	// ...
}

protected HandlerAdapter getHandlerAdapter(Object handler) throws ServletException {  
    if (this.handlerAdapters != null) {  
       for (HandlerAdapter adapter : this.handlerAdapters) {  
          if (adapter.supports(handler)) {  
             return adapter;  
          }  
       }  
    }  
    throw new ServletException("No adapter for handler [" + handler +  
          "]: The DispatcherServlet configuration needs to include a HandlerAdapter that supports this handler");  
}
```
HandlerExecutionChain에는 요청에 맞는 handler가 저장되어있고, 이를 통해 다음과 같이 HandlerAdapter를 조회하고 있다.
### 4. HandlerAdapter를 통해 Controller 메서드를 호출한다.
HandlerAdapter는 HandlerExecutionChain을 처리하는 과정에서, 내부적으로 인터셉터를 관리하여 공통적인 전/후 처리 작업을 수행한다. 예를 들어, 컨트롤러 메서드 호출 전에는 적합한 파라미터를 생성하여 전달하는 작업이 필요하고, 호출 후에는 메시지 컨버터를 사용하여 ResponseEntity의 본문을 찾아 JSON 직렬화와 같은 작업을 처리하는 과정이 필요하다.

HandlerAdapter가 요청하는 코드를 살펴보자.
```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {  

	// ...
	
	// Actually invoke the handler.  
	mv = ha.handle(processedRequest, response, mappedHandler.getHandler()); 

	// ...
}
```
이때 요청의 종류에 따라 HandlerAdapter의 종류가 달라지고, 예시로 @Controller로 어노테이트된 컨트롤러를 처리하는 RequestMappingHandlerAdapter의 코드는 다음과 같다.
```java
public abstract class AbstractHandlerMethodAdapter extends WebContentGenerator implements HandlerAdapter, Ordered {

	@Override  
	@Nullable  
	public final ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {  
	    return handleInternal(request, response, (HandlerMethod) handler);  
	}
}

public class RequestMappingHandlerAdapter extends AbstractHandlerMethodAdapter {

	@Override  
	@Nullable  
	protected ModelAndView handleInternal(HttpServletRequest request,  
	       HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {  
	  
	    ModelAndView mav;  
	    checkRequest(request);  
	  
	    // Execute invokeHandlerMethod in synchronized block if required.  
	    if (this.synchronizeOnSession) {  
	       HttpSession session = request.getSession(false);  
	       if (session != null) {  
	          Object mutex = WebUtils.getSessionMutex(session);  
	          synchronized (mutex) {  
	             mav = invokeHandlerMethod(request, response, handlerMethod);  
	          }  
	       }  
	       else {  
	          // No HttpSession available -> no mutex necessary  
	          mav = invokeHandlerMethod(request, response, handlerMethod);  
	       }  
	    }  
	    // ...
	    return mav;  
	}
}
```
여기서도 중요한건 invokeHandlerMethod를 호출해주고 있다는 것인데, 이를 통해 컨트롤러로 요청을 위임하고있다.
```java
public class RequestMappingHandlerAdapter extends AbstractHandlerMethodAdapter {

	@Nullable  
	protected ModelAndView invokeHandlerMethod(HttpServletRequest request,  
	       HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {  
	  
	    // ...
	  
	    ServletWebRequest webRequest = (asyncWebRequest instanceof ServletWebRequest ?  
	          (ServletWebRequest) asyncWebRequest : new ServletWebRequest(request, response));  
	  
	    WebDataBinderFactory binderFactory = getDataBinderFactory(handlerMethod);  
	    ModelFactory modelFactory = getModelFactory(handlerMethod, binderFactory);  
	  
	    ServletInvocableHandlerMethod invocableMethod = createInvocableHandlerMethod(handlerMethod);  
	    if (this.argumentResolvers != null) {  
	       invocableMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);  
	    }  
	    if (this.returnValueHandlers != null) {  
	       invocableMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);  
	    }  
	    
	    // ...	  
	    
	    invocableMethod.invokeAndHandle(webRequest, mavContainer);  

		// ...
	  
	    return getModelAndView(mavContainer, modelFactory, webRequest);  
	}
}
```
HandlerExecutionChain에는 인터셉터를 통해 전후처리가 진행된다고 했었는데, 이 코드에서는 컨트롤러의 파라미터를 위해 ArgumentResolver가, 반환값 처리를 위해 ReturnValueHandler가 등장한다.

다시 말하면 ArgumentResolver를 통해 컨트롤러의 메서드 인자값을 받고, ReturnValueHandler를 통해 컨트롤러 메서드의 반환값을 얻는 것이다.

세팅이 끝나면 invokeAndHandle이 호출되고, 또 그 내부에서 invokeForRequest가 실행된다.
```java
public class ServletInvocableHandlerMethod extends InvocableHandlerMethod {
	
	public void invokeAndHandle(ServletWebRequest webRequest, ModelAndViewContainer mavContainer,  
	       Object... providedArgs) throws Exception {  
	  
	    Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs);  
	    
	    // ...
	    
	    try {  
	       this.returnValueHandlers.handleReturnValue(  
	             returnValue, getReturnValueType(returnValue), mavContainer, webRequest);  
	    }  
	    catch (Exception ex) {  
	       // ...
	       throw ex;  
	    }  
	}
}

public class InvocableHandlerMethod extends HandlerMethod {
	
	@Nullable  
	public Object invokeForRequest(NativeWebRequest request, @Nullable ModelAndViewContainer mavContainer, Object... providedArgs) throws Exception {  
	    Object[] args = this.getMethodArgumentValues(request, mavContainer, providedArgs);  
	    // ...
		Object returnValue = this.doInvoke(args);
	    return returnValue;  
	}
}
```
여기서는 인자로 받은 값을 받아오는게 중요하다. 우리가 사용하는 어노테이션들을 getMethodArgumentValues에서 처리가 되고 doInvoke에서 만들어진 값으로 컨트롤러의 메서드를 호출한다.
```java
public class InvocableHandlerMethod extends HandlerMethod {
	
	@Nullable  
	protected Object doInvoke(Object... args) throws Exception {  
	    Method method = this.getBridgedMethod();  
	  
	    try {  
	        if (KotlinDetector.isKotlinReflectPresent()) {  
	            // ...
	        }  
	  
	        return method.invoke(this.getBean(), args);  
	    } catch (IllegalArgumentException var8) {  
	        // ...
	    } 
	    return method.invoke(this.getBean(), args);
    }
}
```
자바의 리플렉션으로 컨트롤러의 메소드 객체를 가져온다. 그리고 method.invoke(this.getBean(), args)로 실제 컨트롤러에게 위임을 해주고 있다.

### 5. 반환값(Response)을 HandlerAdapter에게 건내준다.
그리고 다시 ServletInvocableHandlerMethod의 invokeAndHandle 메서드로 다시 돌아온다.

```java
public class ServletInvocableHandlerMethod extends InvocableHandlerMethod {
	
		public void invokeAndHandle(ServletWebRequest webRequest, ModelAndViewContainer mavContainer,  
	       Object... providedArgs) throws Exception {  
	  
	    Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs);  
	    
	    // ...
	    
	    try {  
	       this.returnValueHandlers.handleReturnValue(  
	             returnValue, getReturnValueType(returnValue), mavContainer, webRequest);  
	    }  
	    catch (Exception ex) {  
	       // ...
	       throw ex;  
	    }  
	}
}
```
컨트톨러의 로직이 끝나고 이때 반환값은 returnValue에 담긴다. 이후에는 ReturnValueHandler에서 후 처리를 거친다.
### 6. 반환값에 따라 ResponseEntity로 감싸는 경우가 있고, 이 형식에 따라 다른 Converter가 동작한다.
```java
public class HandlerMethodReturnValueHandlerComposite implements HandlerMethodReturnValueHandler {
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType, ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {  
	    HandlerMethodReturnValueHandler handler = this.selectHandler(returnValue, returnType);  
	    if (handler == null) {  
	        throw new IllegalArgumentException("Unknown return value type: " + returnType.getParameterType().getName());  
	    } else {  
	        handler.handleReturnValue(returnValue, returnType, mavContainer, webRequest);  
	    }  
	}
}
```
어떤 값을 반환하느냐에 따라 HandlerMethosReturnValueHandler 구현체가 정해지고, 예를 들어 ResponseEntity 객체가 반환되는 경우 HttpEntityMethodProcessor가 사용된다.
```java
public class HttpEntityMethodProcessor extends AbstractMessageConverterMethodProcessor {
	@Override  
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,  
	       ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {  
	  
	    mavContainer.setRequestHandled(true);  
	    if (returnValue == null) {  
	       return;  
	    }  
	  
	    ServletServerHttpRequest inputMessage = createInputMessage(webRequest);  
	    ServletServerHttpResponse outputMessage = createOutputMessage(webRequest);  
	  
	    HttpEntity<?> httpEntity;  
	    if (returnValue instanceof ErrorResponse response) {  
	       httpEntity = new ResponseEntity<>(response.getBody(), response.getHeaders(), response.getStatusCode());  
	    }  
	    else if (returnValue instanceof ProblemDetail detail) {  
	       httpEntity = ResponseEntity.of(detail).build();  
	    }  
	    else {  
	       Assert.isInstanceOf(HttpEntity.class, returnValue);  
	       httpEntity = (HttpEntity<?>) returnValue;  
	    }  
	  
	    // ... 
	  
	    // Try even with null body. ResponseBodyAdvice could get involved.  
	    writeWithMessageConverters(httpEntity.getBody(), returnType, inputMessage, outputMessage);  
	  
	    // Ensure headers are flushed even if no body was written.  
	    outputMessage.flush();  
	}
}
```
이 메서드는 응답가능한 타입인지 확인해주고 적절한 Converter와 응답을 처리할 수 있게 해준다.
```java
public abstract class AbstractMessageConverterMethodProcessor extends AbstractMessageConverterMethodArgumentResolver  
       implements HandlerMethodReturnValueHandler {

	protected <T> void writeWithMessageConverters(@Nullable T value, MethodParameter returnType,  
       ServletServerHttpRequest inputMessage, ServletServerHttpResponse outputMessage)  
       throws IOException, HttpMediaTypeNotAcceptableException, HttpMessageNotWritableException {  
  
	    // ...
	  
	    if (isResourceType(value, returnType)) {  
	       outputMessage.getHeaders().set(HttpHeaders.ACCEPT_RANGES, "bytes");  
	       if (value != null && inputMessage.getHeaders().getFirst(HttpHeaders.RANGE) != null &&  
	             outputMessage.getServletResponse().getStatus() == 200) {  
	          Resource resource = (Resource) value;  
	          try {  
	             List<HttpRange> httpRanges = inputMessage.getHeaders().getRange();  
	             outputMessage.getServletResponse().setStatus(HttpStatus.PARTIAL_CONTENT.value());  
	             body = HttpRange.toResourceRegions(httpRanges, resource);  
	             valueType = body.getClass();  
	             targetType = RESOURCE_REGION_LIST_TYPE;  
	          }  
	          catch (IllegalArgumentException ex) {  
	             outputMessage.getHeaders().set(HttpHeaders.CONTENT_RANGE, "bytes */" + resource.contentLength());  
	             outputMessage.getServletResponse().setStatus(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value());  
	          }  
	       }  
	    }
	}
	
	// ...

	if (selectedMediaType != null) {  
		selectedMediaType = selectedMediaType.removeQualityValue();  
	  
	    ResolvableType targetResolvableType = null;  
	    for (HttpMessageConverter converter : this.messageConverters) {  
	       ConverterType converterTypeToUse = null;  
	       if (converter instanceof GenericHttpMessageConverter genericConverter) {  
	          if (genericConverter.canWrite(targetType, valueType, selectedMediaType)) {  
	             converterTypeToUse = ConverterType.GENERIC;  
	          }  
	       }  
	       else if (converter instanceof SmartHttpMessageConverter smartConverter) {  
	          targetResolvableType = getNestedTypeIfNeeded(ResolvableType.forMethodParameter(returnType));  
	          if (smartConverter.canWrite(targetResolvableType, valueType, selectedMediaType)) {  
	             converterTypeToUse = ConverterType.SMART;  
	          }  
	       }  
	       else if (converter.canWrite(valueType, selectedMediaType)){  
	          converterTypeToUse = ConverterType.BASE;  
	       }  
	       if (converterTypeToUse != null) {  
	          body = getAdvice().beforeBodyWrite(body, returnType, selectedMediaType,  
	                (Class<? extends HttpMessageConverter<?>>) converter.getClass(), inputMessage, outputMessage);  
	          if (body != null) {  
	             Object theBody = body;  
	             LogFormatUtils.traceDebug(logger, traceOn ->  
	                   "Writing [" + LogFormatUtils.formatValue(theBody, !traceOn) + "]");  
	             addContentDispositionHeader(inputMessage, outputMessage);  
	             switch (converterTypeToUse) {  
	                case BASE -> converter.write(body, selectedMediaType, outputMessage);  
	                case GENERIC -> ((GenericHttpMessageConverter) converter).write(body, targetType, selectedMediaType, outputMessage);  
	                case SMART -> ((SmartHttpMessageConverter) converter).write(body, targetResolvableType, selectedMediaType, outputMessage, null);  
	             }  
	          }  
	          else {  
	             if (logger.isDebugEnabled()) {  
	                logger.debug("Nothing to write: null body");  
	             }  
	          }  
	          return;  
	       }  
	    }  
	}
	
	// ...
	
}
```

## Summary (by ChatGPT)
Spring MVC의 `DispatcherServlet` 처리 흐름을 목록으로 정리한 내용은 다음과 같다:
1. **DispatcherServlet**:
	- 클라이언트 요청을 중앙에서 처리하는 역할
	- `HandlerMapping`, `HandlerAdapter`, `ReturnValueHandler` 등 delegate components를 사용하여 요청을 처리
2. **HandlerExecutionChain**:
    - 실제 핸들러(컨트롤러 메서드)와 이를 전후로 처리할 인터셉터들을 관리
    - 요청에 맞는 핸들러와 인터셉터를 찾아 전후 처리 작업 수행
3. **HandlerMapping**:
    - 요청에 맞는 컨트롤러를 찾아 반환
4. **HandlerAdapter**:
    - 컨트롤러 메서드를 호출하기 위한 어댑터 역할
    - 적합한 `ArgumentResolver`로 파라미터를 처리하고, `ReturnValueHandler`로 반환값을 처리
5. **ArgumentResolver**:
    - 컨트롤러 메서드의 파라미터 값을 생성하여 전달
6. **ReturnValueHandler**:
    - 컨트롤러 메서드의 반환값을 처리
    - 반환값에 따라 적합한 메시지 컨버터를 사용하여 직렬화 처리
7. **MessageConverter**:
    - 반환값을 직렬화하여 클라이언트에게 전달
    - 예: `StringHttpMessageConverter`, `MappingJackson2HttpMessageConverter` 등
8. **최종 처리**:
    - 반환값이 `ResponseEntity`라면, 적합한 `HttpMessageConverter`로 직렬화하여 응답 처리