# Go Patterns

- **Handler → Service → Repository** layering
- Use `sync.Once` for lazy init, `sync.Pool` for reusable objects
- Graceful shutdown with `signal.NotifyContext`
- Testing: table-driven tests, `testify/assert`, `httptest`
- Overlap check: before adding a Go dependency, search `go.mod` and existing `pkg/`