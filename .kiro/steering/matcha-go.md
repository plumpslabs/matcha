---
description: Matcha Go coding standards and patterns
inclusion: fileMatch
fileMatchPattern: "*.go"
---

# Go Standards

## Error Handling
```
// ❌ Bad
result, _ := doSomething()
// ✅ Good
result, err := doSomething()
if err != nil {
    return fmt.Errorf("doSomething: %w", err)
}
```

## Idiomatic Go
No panic for expected errors, channels over shared memory

## Context
Always pass context.Context for cancellation

## No Global State
Use dependency injection

# Go Patterns
- Handler → Service → Repository layering
- sync.Once for lazy init
- Graceful shutdown with signal.NotifyContext
- Testing: table-driven tests, testify/assert, httptest

## Checklist
- [ ] Errors always checked — no `_` assignments
- [ ] Context passed for cancellable operations
- [ ] Defer for cleanup — paired with acquisition
- [ ] Interfaces where consumed (small, 1-3 methods)
- [ ] No global mutable state — DI
- [ ] Table-driven tests with case names
- [ ] Before adding dep: search `go.mod` + `pkg/` first
