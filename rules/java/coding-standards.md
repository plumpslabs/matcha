# Java Coding Standards

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
// ❌ Bad — boilerplate
public class User {
    private String id;
    private String name;
    // getters, setters, toString, equals, hashCode...
}

// ✅ Good — record (Java 16+)
public record User(String id, String name) {}
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
```

## Streams
```java
// ✅ Prefer Stream API over loops with mutation
List<String> names = users.stream()
    .filter(u -> u.isActive())
    .map(User::getName)
    .toList();
```
