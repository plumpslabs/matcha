# Go Patterns

## Architecture
- **Handler → Service → Repository** (3-layer)
- Handlers: HTTP/transport concerns only (parse request, write response)
- Services: business logic, orchestration, no transport awareness
- Repositories: data access abstraction (interfaces)
- Keep `main.go` thin: config → wire dependencies → start server

## Interfaces
- Define interfaces where they're consumed, not where they're implemented
- Small interfaces (1-3 methods) — `io.Reader`, `io.Writer` pattern
- Accept interfaces, return concrete types

## Concurrency
- Use `errgroup` for goroutine lifecycle management with error propagation
- `sync.Once` for lazy initialization, `sync.Pool` for reusable objects
- `sync.Map` only for special cases (usually prefer mutex + map)
- Channels for orchestration, mutexes for state protection
- Always handle context cancellation (`ctx.Done()`)

## Lifecycle
- Graceful shutdown: `signal.NotifyContext` + `http.Server.Shutdown`
- `defer` for cleanup (file close, mutex unlock, db close)
- Wire dependencies explicitly in `main.go` or use `wire`

## Struct Tags
```go
// ✅ Validation + serialization tags
type User struct {
    ID    string `json:"id" validate:"required,uuid"`
    Email string `json:"email" validate:"required,email"`
}
```

## Testing
- **Table-driven tests** with descriptive cases
- **`testify/assert`** or `testify/require` for assertions
- **`httptest`** for HTTP handler testing
- **`testcontainers-go`** for integration tests (DB, Redis)
- Test files in same package (`_test.go`), use external test package for black-box

## Build & Tooling
- `//go:build` tags for platform-specific code
- `go generate` for code generation (mockgen, stringer)
- `gofmt` for formatting — enforce in CI
- `golangci-lint` for linting (enable errcheck, govet, staticcheck)

## Dependency Check
Before adding a Go dependency:
1. Search `go.mod` + existing `pkg/`, `internal/` for existing implementation
2. Prefer stdlib: net/http over gin for simple APIs
3. Check module size and dependency tree with `go mod why`