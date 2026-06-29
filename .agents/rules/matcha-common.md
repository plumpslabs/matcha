---
description: Matcha universal coding standards — testing, git, and conventions for all projects
globs: ["**/*"]
alwaysApply: true
---

# Common Coding Standards

## No Hardcoded Values
Use env vars: `APPNAME_VAR_NAME`

## Error Handling
```typescript
// ❌ Bad — swallowed
try { await risky(); } catch {}

// ✅ Good — explicit
try { await risky(); } catch (e) {
  logger.error("failed", e); throw;
}
```

## One Function, One Thing
```typescript
// ❌ Bad
function handle(data) { validate(data); save(data); email(data); }
// ✅ Good
async function createUser(data) { await validate(data); return save(data); }
```

## Type Safety
```typescript
// ❌ Bad — type escape hatch
const data: any = fetchData();
// ✅ Good — typed
const data: unknown = fetchData();
```
Prefer the type system over runtime escape hatches (`any`, `interface{}`, `Any`, `mixed`, raw types).

## Prefer Stdlib over new deps
3 use cases before abstracting (within same task/PR)

## Observability
Use structured logging: log level (info/warn/error), context-rich messages.
Never commit `console.log` without a proper logger.

## Pure Functions
Prefer pure functions for logic. Isolate side effects (I/O, DB, API, mutations) at boundaries.

## Config Validation
Validate required config at startup. Fail fast with descriptive error if required env vars missing.
## No Premature Optimization
Write clean, readable code first. Optimize only when:
1. You have **measured** a bottleneck
2. It's in a **hot path** (frequent execution)
3. It **doesn't sacrifice readability** for marginal gains

Premature optimization = trading readability for performance you don't need yet.

## Validate at Boundaries
Validate input at layer boundaries (controller/API). Partial failure after partial write is worse than early rejection.

## Command-Query Separation (CQS)
Commands change state (return void). Queries return data (no side effects). Never both in one function.

## Idempotency
Operations should be safe to retry. Same request sent twice = same result. Use idempotency keys for payments, webhooks, retry logic.

## Deliberate Shortcuts
`// matcha: [reason]` on every shortcut

## Checklist
- [ ] Type-safe by default — no escape hatches (`any`, `interface{}`, `Any`, `mixed`, raw types)
- [ ] No hardcoded values — env vars with `APPNAME_VAR_NAME`
- [ ] Error paths explicit — no empty catch blocks
- [ ] One function = one responsibility
- [ ] Files ≤ 300 lines — split if bigger
- [ ] No N+1 queries — batch + paginate hot paths
- [ ] No duplicated logic — DRY
- [ ] Observability — structured logging, no plain console.log
- [ ] Validate at boundaries — input validated before mutation
- [ ] CQS — commands return void, queries return data
- [ ] Idempotency — retry-safe with idempotency keys
- [ ] Contract-first — draft response/props shape before implementation
- [ ] Error shape consistent — same format across all endpoints
- [ ] State origin clear — is this server, client, or shared state?
- [ ] Pure functions — side effects isolated at boundaries
- [ ] Config validated at startup — fail fast if env vars missing
- [ ] No premature optimization — readable first, profile before optimizing
- [ ] Shortcuts documented with `// matcha:`

# Testing Standards

## TDD Workflow (Red → Green → Refactor)
For new features:
1. 🔴 Write test first — expect FAIL
2. 🟢 Write minimum code to pass
3. 🔵 Refactor, re-run to confirm still green

## Principles
- Tests must be deterministic
- Test behavior, not implementation
- Min 80% coverage on new code
- Before commit → test suite must pass

## Checklist
- [ ] Tests written before implementation for new features
- [ ] No `test.skip` or `test.only` committed
- [ ] External boundaries mocked, internal tested real

# Git Workflow
- Conventional commits: `feat:` `fix:` `refactor:` `docs:` `test:` `chore:`
- Subject ≤72 chars, imperative mood
- Body explains WHY, not what
- One commit = one logical change
- Short-lived branches, rebase to main daily

## Checklist
- [ ] Conventional commit format used
- [ ] No debug code committed (`console.log`, `debugger`)
- [ ] One commit = one logical change