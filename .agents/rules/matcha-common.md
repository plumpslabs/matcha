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

## Prefer Stdlib over new deps
3 use cases before abstracting (within same task/PR)

## Deliberate Shortcuts
`// matcha: [reason]` on every shortcut

## Checklist
- [ ] No hardcoded values — env vars with `APPNAME_VAR_NAME`
- [ ] Error paths explicit — no empty catch blocks
- [ ] One function = one responsibility
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