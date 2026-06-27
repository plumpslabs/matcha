---
paths:
- "**/*.java"
---

# Java Coding Standards

> This file extends [common/coding-standards.md](../common/coding-standards.md) with Java-specific rules.

## No Null
```java
// ❌ Bad
String name = null;
if (user != null) { name = user.getName(); }

// ✅ Good — Optional
String name = Optional.ofNullable(user)
    .map(User::getName)
    .orElse("default");

// ✅ Good — Objects.requireNonNull
public UserService(UserRepo repo) {
    this.repo = Objects.requireNonNull(repo);
}
```

## Records over Classes
```java
// ❌ Bad — boilerplate (getters, setters, equals, hashCode...)
public class User {
    private String id;
    private String name;
}

// ✅ Good — record (Java 16+)
public record User(String id, String name) {}

// ✅ Record with validation in compact constructor
public record Email(String value) {
    public Email {
        Objects.requireNonNull(value);
        if (!value.contains("@")) throw new IllegalArgumentException("Invalid email");
    }
}
```

## Sealed Classes & Pattern Matching
```java
// ✅ Sealed class for restricted hierarchies
public sealed interface PaymentResult
    permits Success, Failure, Pending {}

public record Success(String transactionId) implements PaymentResult {}
public record Failure(String reason, String code) implements PaymentResult {}
public record Pending(String status) implements PaymentResult {}

// ✅ Pattern matching for switch (Java 21+)
public String handleResult(PaymentResult result) {
    return switch (result) {
        case Success s -> "Completed: " + s.transactionId();
        case Failure f -> throw new PaymentException(f.reason());
        case Pending p -> "Processing";
    };
}
```

## Error Handling
```java
// ❌ Bad — swallowed
try { risky(); } catch (Exception e) {}

// ✅ Good — explicit
try {
    risky();
} catch (IOException e) {
    logger.error("risky failed", e);
    throw new AppException("operation failed", e);
}

// ✅ Custom exception hierarchy
public abstract class AppException extends RuntimeException {
    public abstract HttpStatus getStatus();
}
public class NotFoundException extends AppException {
    public NotFoundException(String message) { super(message); }
    @Override public HttpStatus getStatus() { return HttpStatus.NOT_FOUND; }
}
```
## Streams & Optional
```java
// ✅ Prefer Stream API over loops with mutation
List<String> names = users.stream()
    .filter(u -> u.isActive())
    .map(User::getName)
    .toList();  // .toList() returns immutable list (Java 16+)

// ✅ Optional for nullable returns
public Optional<User> findByEmail(String email) {
    return Optional.ofNullable(userCache.get(email));
}
```

## Checklist

- [ ] No null — `Optional`, `Objects.requireNonNull`, or `@NotNull`
- [ ] Records over classes for data carriers (Java 16+)
- [ ] Modern Java features used (sealed classes, pattern matching, text blocks)
- [ ] Error handling specific — no empty catch blocks
- [ ] Constructor injection with `final` fields
- [ ] DTOs at API boundaries, entities kept internal

## Modern Java Features (17/21+)
```java
// ✅ Text blocks for multiline strings
String json = """
    {
        "id": "%s",
        "name": "%s"
    }
    """.formatted(id, name);

// ✅ instanceof pattern matching (Java 16+)
if (obj instanceof String s && !s.isEmpty()) {
    System.out.println(s.toUpperCase());
}

// ✅ var for obvious types (local variables only)
var users = userRepository.findAll();  // List<User> is obvious
// ❌ Don't use var when type is unclear
var result = process();  // What type? Bad.
```
