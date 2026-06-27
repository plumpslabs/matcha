# Testing Standards

> Test behavior, not implementation. Deterministic. 80%+ coverage.

## TDD Workflow (Red → Green → Refactor)

For new features or safety-critical changes, follow strict TDD:

```
🔴 RED     → Write test first. It should fail.
🟢 GREEN   → Write minimum code to pass. Not elegant, just pass.
🔵 REFACTOR → Clean up. Code + test. Re-run to confirm still green.
```

```typescript
// 1. 🔴 Write test first
test("should return user when valid ID", async () => {
  const result = await service.getUser("valid-id");
  expect(result).toEqual({ id: "valid-id", name: "John" });
});
// → Run: FAIL (service.getUser doesn't exist yet)

// 2. 🟢 Write minimum implementation
async function getUser(id: string) {
  return { id, name: "John" }; // hardcoded — fine, make it pass first
}
// → Run: PASS

// 3. 🔵 Refactor — now make it real
async function getUser(id: string) {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");
  return user;
}
// → Run: PASS (refactor didn't break behavior)
```

**Rule of thumb:** If you catch yourself writing implementation code without a test first for a new feature, STOP. Write the test first.

## Test Types & Ratio
- **Unit tests** (70%) — isolated logic: services, utils, domain models. Fast, no I/O.
- **Integration tests** (20%) — boundaries: API endpoints, database queries, external services.
- **E2E tests** (10%) — critical user journeys only: login, payment, core flow.

## Principles
- Tests must be **deterministic** — same input = same result, always
- Test **behavior**, not implementation — refactoring shouldn't break tests
- One logical assertion per test case
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

## Checklist

- [ ] Tests written before implementation (TDD) for new features
- [ ] Tests are deterministic — no flaky timeouts, no shared mutable state
- [ ] Coverage ≥ 80% on new code
- [ ] No `test.skip` or `test.only` committed
- [ ] External boundaries mocked, internal logic tested real