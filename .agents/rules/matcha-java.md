---
description: Matcha Java coding standards and patterns
globs: ["**/*.java"]
alwaysApply: false
---

# Java Standards

## Generics & Type Safety
```java
// ❌ Bad — raw type
List list = new ArrayList();
// ✅ Good — parameterized
List<String> list = new ArrayList<>();
```
No raw types — always parameterize generics.

## No Null
```java
// ❌ Bad
String name = null;
if (user != null) { name = user.getName(); }

// ✅ Good — Optional
String name = Optional.ofNullable(user)
    .map(User::getName)
    .orElse("default");
```

## Records over Classes (Java 16+)
```java
// ❌ Bad — boilerplate
public class User {
    private String id; private String name;
    // getters, setters...

// ✅ Good — record
public record User(String id, String name) {}
```

## Error Handling
```java
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
- [ ] No raw types — always parameterize generics
- [ ] No null — `Optional`, `Objects.requireNonNull`, or `@NotNull`
- [ ] Records over classes for data carriers (Java 16+)
- [ ] Modern Java features used (sealed classes, pattern matching)
- [ ] Specific error handling — no empty catch
- [ ] Constructor injection with `final` fields
- [ ] DTOs at API boundaries, entities kept internal
- [ ] Before adding Maven dep: search `pom.xml` + existing `src/main/java/` first
