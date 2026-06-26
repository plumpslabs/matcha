# Go Coding Standards

## Error Handling
```go
// ❌ Bad — swallowed
result, _ := doSomething()

// ✅ Good — explicit
result, err := doSomething()
if err != nil {
    return fmt.Errorf("doSomething: %w", err)
}
```

## Idiomatic Go
```go
// ❌ Bad — panic for expected errors
if err != nil { panic(err) }

// ✅ Good — return error
if err != nil { return err }

// ❌ Bad — shared memory
var counter int
mu := sync.Mutex{}

// ✅ Good — channels
type Counter struct { ch chan int }
```

## Context
```go
// ✅ Always pass context for cancellation
func FetchData(ctx context.Context, id string) (Data, error) {
    // ...
}
```

## No Global State
```go
// ❌ Bad
var db *sql.DB

// ✅ Good — dependency injection
type Handler struct { db *sql.DB }
```
