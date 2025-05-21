---
title: How Spring Injects HttpSession
date: 2025-05-10 09:44:21
updated: 2025-05-11 22:27:18
publish: true
tags:
  - spring
series: 
---
지난 포스트에서 DispatcherServlet에 대해 공부를 했고, 요즘은 로그인 과정에 대해 배우고 있다. 그 중에서 session 로그인 과정을 공부하던 중에 의문이 생기는 코드가 있어서 이번 포스트에서는 이 코드를 실행할 때 Spring 내부에서 일어나는 일련의 과정을 알아보고자 한다.

## 문제 상황
```java
// cholog, spring-auth-1 코드 중 세션 관련 일부

@PostMapping("/login/session")  
public ResponseEntity<Void> sessionLogin(HttpServletRequest request, HttpSession session) {  
    final Map<String, String[]> paramMap = request.getParameterMap();  
    String email = paramMap.get(USERNAME_FIELD)[0];  
    String password = paramMap.get(PASSWORD_FIELD)[0];  
  
    if (authService.checkInvalidLogin(email, password)) {  
        throw new AuthorizationException();  
    }  
  
    session.setAttribute(SESSION_KEY, email);  
  
    return ResponseEntity.ok().build();  
}  
  
@GetMapping("/members/me/session")  
public ResponseEntity<MemberResponse> findMyInfo(HttpSession session) {  
    String email = (String) session.getAttribute(SESSION_KEY);  
    MemberResponse member = authService.findMember(email);  
    return ResponseEntity.ok().body(member);  
}
```
```java
@Test  
void sessionLogin() {  
    String cookie = RestAssured  
            .given().log().all()  
            .param(USERNAME_FIELD, EMAIL)  
            .param(PASSWORD_FIELD, PASSWORD)  
            .when().post("/login/session")  
            .then().log().all()  
            .extract()  
            .header("Set-Cookie").split(";")[0];  
  
    MemberResponse member = RestAssured  
            .given().log().all()  
            .header("Cookie", cookie)  
            .accept(MediaType.APPLICATION_JSON_VALUE)  
            .when().get("/members/me/session")  
            .then().log().all()  
            .statusCode(HttpStatus.OK.value()).extract().as(MemberResponse.class);  
  
    assertThat(member.getEmail()).isEqualTo(EMAIL);  
}
```
테스트 코드를 보면 단순히 이메일과 비밀번호를 파라미터 값으로 넘겨주고 있는데 컨트롤러의 PostMapping 해주는 코드에서는 request외에도 session을 받아주고, 메서드 내부에서도 `session.setAttribute(SESSION_KEY, email)` 을 해주고 있다. 

누가 메서드의 파라미터로 session까지 넣어주는걸까?

## Spring MVC의 핵심 흐름
[[spring-mvc-dispatcherservlet]]에서 다루었듯이 파라미터를 처리하는 역할을 담당하는 건 ArgumentResolver의 한 종류이다. Spring MVC는 컨트롤러의 메서드를 실행할 때 실제로 HandlerMethodArgumentResolver 목록을 순회하며 파라미터를 처리한다.

세부 흐름은 다음과 같다.
```scss
DispatcherServlet
 └── HandlerAdapter
      └── InvocableHandlerMethod
           └── HandlerMethodArgumentResolverComposite
                └── 각 ArgumentResolver의 supportsParameter() 호출

```

코드 상에서는 다음과 같은 모습으로 호출이된다.
```java
// InvocableHandlerMethod.class 내부

protected Object[] getMethodArgumentValues(NativeWebRequest request, @Nullable ModelAndViewContainer mavContainer, Object... providedArgs) throws Exception {  
    MethodParameter[] parameters = this.getMethodParameters();  
    if (ObjectUtils.isEmpty(parameters)) {  
        return EMPTY_ARGS;  
    } else {  
        Object[] args = new Object[parameters.length];  
  
        for(int i = 0; i < parameters.length; ++i) {  
            MethodParameter parameter = parameters[i];  
            parameter.initParameterNameDiscovery(this.parameterNameDiscoverer);  
            args[i] = findProvidedArgument(parameter, providedArgs);  
            if (args[i] == null) {  
                if (!this.resolvers.supportsParameter(parameter)) {  
                    throw new IllegalStateException(formatArgumentError(parameter, "No suitable resolver"));  
                }  
  
                try {  
                    args[i] = this.resolvers.resolveArgument(parameter, mavContainer, request, this.dataBinderFactory);  
                } catch (Exception var10) {  
                    if (logger.isDebugEnabled()) {  
                        String exMsg = var10.getMessage();  
                        if (exMsg != null && !exMsg.contains(parameter.getExecutable().toGenericString())) {  
                            logger.debug(formatArgumentError(parameter, exMsg));  
                        }  
                    }  
  
                    throw var10;  
                }  
            }  
        }  
  
        return args;  
    }  
}
```
이때 HttpSession 타입을 지원해주는 게 바로 ServletRequestMethodArgumentResolver이다.

## ArgumentResolver가 뭘 해주나?
```java
public interface HandlerMethodArgumentResolver {  
    boolean supportsParameter(MethodParameter parameter);  
  
    @Nullable  
    Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer, NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception;  
}
```

ArgumentResolver는 각 파라미터를 지원해주는지 판단하고, 변환해준다.

### 그 중에서 ServletRequestMethodArgumentResolver은?
```java
// ServletRequestMethodArgumentResolver.class

public boolean supportsParameter(MethodParameter parameter) {  
    Class<?> paramType = parameter.getParameterType();  
    return WebRequest.class.isAssignableFrom(paramType) ||
    ServletRequest.class.isAssignableFrom(paramType) ||   
    MultipartRequest.class.isAssignableFrom(paramType) ||
    HttpSession.class.isAssignableFrom(paramType) ||
    PushBuilder.class.isAssignableFrom(paramType) ||
    Principal.class.isAssignableFrom(paramType) &&
    !parameter.hasParameterAnnotations() ||
    InputStream.class.isAssignableFrom(paramType) ||
    Reader.class.isAssignableFrom(paramType) || 
    HttpMethod.class == paramType || 
    Locale.class == paramType || 
    TimeZone.class == paramType || 
    ZoneId.class == paramType;  
}

@Nullable  
private Object resolveArgument(Class<?> paramType, HttpServletRequest request) throws IOException {  
    if (HttpSession.class.isAssignableFrom(paramType)) {  
        HttpSession session = request.getSession();  
        if (session != null && !paramType.isInstance(session)) {  
            String var13 = paramType.getName();  
            throw new IllegalStateException("Current session is not of type [" + var13 + "]: " + session);  
        } else {  
            return session;  
        }
	}
	// ...
}
```

그럼 다시 원래 코드로 돌아와서,
```java
@PostMapping("/login/session")  
public ResponseEntity<Void> sessionLogin(HttpServletRequest request, HttpSession session) {  
    final Map<String, String[]> paramMap = request.getParameterMap();  
    String email = paramMap.get(USERNAME_FIELD)[0];  
    String password = paramMap.get(PASSWORD_FIELD)[0];  
  
    if (authService.checkInvalidLogin(email, password)) {  
        throw new AuthorizationException();  
    }  
  
    session.setAttribute(SESSION_KEY, email);  
  
    return ResponseEntity.ok().build();  
}  
```
파라미터로 HttpSession을 받고 있기 때문에 ServletRequestMethodArgumentResolver.resolveArgument에서 session을 반환해줄 수 있는 것이다.

## 번외
### 성능 이슈는 없을까?
Q. Spring MVC는 컨트롤러의 메서드를 실행할 때 실제로 HandlerMethodArgumentResolver 목록을 순회하며 파라미터를 처리한다고 했는데, HandlerMethodArgumentResolver가 많으면 매번 찾을 때마다 성능 문제가 생기지 않을까?

A. Spring에서 이미 고려해주고 있다.
HandlerMethodArgumentResolverComposite의 필드로 캐시된 값들을 관리해주고 있다.

```java
public class HandlerMethodArgumentResolverComposite implements HandlerMethodArgumentResolver {
	private final Map<MethodParameter, HandlerMethodArgumentResolver> argumentResolverCache;
	// ...
}
```
