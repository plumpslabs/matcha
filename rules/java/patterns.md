# Java Patterns

## Architecture (Spring Boot)
- **3-layer**: `Controller → Service → Repository`
- **DTOs at boundaries**: never expose entities directly in controllers
- **`@ControllerAdvice`** for global exception handling
- **Constructor injection**: always use `final` fields, never field injection

## Modern Java (17/21+)
```java
// ✅ Records for immutable data carriers
public record UserDto(String id, String name, String email) {}

// ✅ Sealed classes for restricted hierarchies
public sealed interface PaymentResult
    permits Success, Failure, Pending {}
public record Success(String transactionId, BigDecimal amount) implements PaymentResult {}
public record Failure(String reason, String code) implements PaymentResult {}

// ✅ Pattern matching for switch
return switch (result) {
    case Success s -> s.transactionId();
    case Failure f -> throw new PaymentException(f.reason());
    case Pending p -> "processing";
};

// ✅ Text blocks for SQL/JSON/HTML
String sql = """
    SELECT u.*, p.name AS profile_name
    FROM users u
    JOIN profiles p ON p.user_id = u.id
    WHERE u.status = 'active'
    """;
```

## JPA & Data Access
- **`@EntityGraph`** for N+1 prevention (explicit fetch plans)
- **`@Transactional`** at service layer, never controller
- `Pageable` for pagination, never manual limit/offset
- Auditing: `@CreatedDate`, `@LastModifiedDate` via `JpaAuditing`

## Error Handling
```java
// ✅ Global via @ControllerAdvice
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException e) {
        return ResponseEntity.status(404).body(new ErrorResponse(e.getMessage(), "NOT_FOUND"));
    }
}
```
- Custom business exceptions extend `RuntimeException`
- Never catch and swallow — always log and rethrow/translate
- Validation errors: `@Valid` + `MethodArgumentNotValidException` handler

## Testing
- **JUnit 5** + **Mockito** + **AssertJ** (fluent assertions)
- **@WebMvcTest** for controller slice tests
- **@DataJpaTest** for repository tests
- **@SpringBootTest** for integration tests
- **Testcontainers** for database/Redis integration tests
- Unit test business logic in services, integration test boundaries

## Dependency Check
Before adding a Maven/Gradle dependency:
1. Search `pom.xml` or `build.gradle` + existing `util/`, `helper/` packages
2. Check Maven Central for maintenance (last update, vulnerabilities)
3. Does Spring Boot starter already include this?