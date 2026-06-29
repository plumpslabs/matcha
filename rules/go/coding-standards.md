---
paths:
- "**/*.go"
---

# Go Coding Standards

> This file extends [common/coding-standards.md](../common/coding-standards.md) with Go-specific rules.

## Error Handling
```go
// ❌ Bad — swallowed
result, _ := doSomething()

// ✅ Good — explicit with wrapping
result, err := doSomething()
if err != nil {
    return fmt.Errorf("doSomething: %w", err)
}

// ✅ Error wrapping at boundaries (add context, preserve original)
func GetUser(ctx context.Context, id string) (User, error) {
    user, err := db.FindUser(ctx, id)
    if err != nil {
        return User{}, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}

// ✅ Sentinel errors for expected failures
var ErrNotFound = errors.New("user not found")
```

## Idiomatic Go
```go
// ❌ Bad — panic for expected errors
if err != nil { panic(err) }

// ✅ Good — return error
if err != nil { return err }

// ❌ Bad — shared memory with manual mutex
var counter int
mu := sync.Mutex{}

// ✅ Good — atomic or channel-based
import "sync/atomic"
var counter atomic.Int64
counter.Add(1)
```

## Context
```go
// ✅ Always pass context as first parameter for cancellation/timeouts
func FetchData(ctx context.Context, id string) (Data, error) {
    // Respect context cancellation:
    select {
    case <-ctx.Done():
        return Data{}, ctx.Err()
    default:
    }
    // ... do work
}
```

## Defer Patterns
```go
// ✅ Defer for cleanup — paired with resource acquisition
f, err := os.Open(filename)
if err != nil {
    return err
}
defer f.Close()

// ✅ Defer for timing
func doSomething() {
    defer log.Duration("doSomething", time.Now())
    // ... work
}

// ✅ Defer with named return
type Handler struct { db *sql.DB }

func (h *Handler) GetUser(ctx context.Context, id string) (user User, err error) {
    tx, err := h.db.BeginTx(ctx, nil)
    if err != nil {
        return User{}, err
    }
    defer tx.Rollback() // no-op if already committed

    user = /* query tx */
    return user, tx.Commit()
}
```

## Interface Design
```go
// ✅ Define interfaces where they're consumed (small, focused)
type UserStore interface {
    Get(ctx context.Context, id string) (User, error)
    Save(ctx context.Context, user User) error
}

// ✅ Accept interfaces, return concrete types
func NewHandler(store UserStore) *Handler {
    return &Handler{store: store}
}
```

## Type Safety
```go
// ❌ Bad — empty interface as escape hatch
func process(data interface{}) interface{} { return data }
// ✅ Good — concrete type or generics
func process[T any](data T) T { return data }
// ✅ Good — explicit interface
func process(data io.Reader) ([]byte, error) { return io.ReadAll(data) }
```

Go's `interface{}` is the universal escape hatch. Prefer concrete types or generics (Go 1.18+).
If you need abstraction, define a small interface with 1-3 methods where it's consumed.

## No Global State
```go
// ❌ Bad — global mutable state
var db *sql.DB

// ✅ Good — dependency injection
type Handler struct { db *sql.DB }
func NewHandler(db *sql.DB) *Handler { return &Handler{db: db} }
```

## Checklist

- [ ] No `interface{}` as escape hatch — use concrete types, generics, or small interfaces
- [ ] Errors always checked — no `_` assignments for errors
- [ ] Error wrapping with `%w` at boundaries
- [ ] Context passed as first parameter for cancellable operations
- [ ] Defer for cleanup — paired with resource acquisition
- [ ] Interfaces defined where consumed (small, 1-3 methods)
- [ ] No global mutable state — dependency injection
- [ ] `gofmt` formatting — enforce in CI
- [ ] Table-driven tests with descriptive case names
