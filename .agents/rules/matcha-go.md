---
description: Matcha Go coding standards and patterns
globs: ["**/*.go"]
alwaysApply: false
---

# Go Standards

## Error Handling
```go
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
Always pass `context.Context` for cancellation

## Type Safety
```go
// ❌ Bad — empty interface as escape hatch
func process(data interface{}) interface{} { return data }
// ✅ Good — concrete type or generics
func process[T any](data T) T { return data }
```
Prefer concrete types, generics, or small interfaces over `interface{}` as escape hatch.

## No Global State
Use dependency injection

# Go Patterns
- Handler → Service → Repository layering
- `sync.Once` for lazy init
- Graceful shutdown with `signal.NotifyContext`
- Testing: table-driven tests, `testify/assert`, `httptest`

## Checklist
- [ ] No `interface{}` as escape hatch — concrete types, generics, or small interfaces
- [ ] Errors always checked — no `_` assignments for errors
- [ ] Error wrapping with `%w` at boundaries
- [ ] Context passed for cancellable operations
- [ ] Defer for cleanup — paired with resource acquisition
- [ ] Interfaces defined where consumed (small, 1-3 methods)
- [ ] No global mutable state — dependency injection
- [ ] Table-driven tests with descriptive case names
- [ ] Before adding Go dep: search `go.mod` and existing `pkg/` first
