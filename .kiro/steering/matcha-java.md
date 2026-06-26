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

# 🔎 Reuse check
Before adding Maven dep: search pom.xml + existing src/main/java/
