# Testing Standards

## Test Types
- **Unit tests**: test isolated logic (services, utils, domain models) — fast, no I/O
- **Integration tests**: test boundaries (API endpoints, database queries, external services)
- **E2E tests**: critical user journeys only (login, payment, core flow)
- **Ratio**: 70% unit / 20% integration / 10% e2e

## Principles
- Tests must be **deterministic** — same input = same result, always
- Test **behavior**, not implementation — refactoring shouldn't break tests
- One assertion per test case (or logical group)
- **80%+ coverage** on new code (line + branch)
- Naming: `TestXxx` (Go/Java), `test_xxx` (Python/PHP), `should behave when condition` (TS/JS)

## Patterns
```typescript
// ✅ Arrange → Act → Assert
test("should return user when valid ID", async () => {
  // Arrange
  const id = "valid-id";
  mockRepo.getUser.mockResolvedValue({ id, name: "John" });

  // Act
  const result = await service.getUser(id);

  // Assert
  expect(result).toEqual({ id, name: "John" });
  expect(mockRepo.getUser).toHaveBeenCalledWith(id);
});
```

## Mocking
- Mock **external** boundaries (database, APIs, filesystem)
- Don't mock **internal** logic — test the real implementation
- Prefer **in-memory** implementations over mocks when possible
- Integration tests: use **Testcontainers** or in-memory DB (SQLite, H2)

## Test File Placement
```
# Colocate with source file, same naming convention
src/
  services/user.service.ts
  services/__tests__/user.service.test.ts    # TS/JS
  services/user.service.test.ts              # Alternative TS/JS
  services/user_service_test.go              # Go
  services/test_user_service.py              # Python
  services/UserServiceTest.java              # Java
```

## Pre-Commit
- Test suite must pass before any commit
- No `test.skip`, `test.only`, `fdescribe`, `fit` in committed code
- Matcha review: before commit → verify test suite passes

## Coverage Guidelines
```
├── Domain/Service layer →  90%+  (core business logic)
├── API/Controller layer →  80%+  (request parsing + validation)
├── UI Components      →  70%+  (rendering + interactions)
└── Infrastructure     →  60%+  (DB, cache, external calls — focus on error paths)
```