---
description: Matcha Java coding standards and patterns
inclusion: fileMatch
fileMatchPattern: "*.java"
---

# Java Standards

## No Null
```
// ❌ Bad
String name = null;
if (user != null) { name = user.getName(); }
// ✅ Good — Optional
String name = Optional.ofNullable(user)
    .map(User::getName)
    .orElse("default");
```

## Records over Classes (Java 16+)
```
// ❌ Bad — boilerplate
public class User { private String id; ... }
// ✅ Good — record
public record User(String id, String name) {}
```

## Error Handling
```
// ❌ Bad — swallowed
try { risky(); } catch (Exception e) {}
// ✅ Good
try { risky(); }
catch (IOException e) {
    logger.error("failed", e);
    throw new AppException("op failed", e);
}
```

# Java Patterns
- Spring: constructor injection, not field injection
- Stream API over loops with mutation
- Testing: JUnit 5, Mockito

## Checklist
- [ ] No null — `Optional`, `Objects.requireNonNull`
- [ ] Records over classes (Java 16+)
- [ ] Modern features: sealed classes, pattern matching
- [ ] Constructor injection with `final` fields
- [ ] DTOs at API boundaries, entities internal
- [ ] Before adding dep: search `pom.xml` + `src/main/java/` first
