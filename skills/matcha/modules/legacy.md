# 🍵 matcha — Legacy Code Protocol

> For big codebases, legacy code, and high-risk refactoring.
> Safe, incremental, traceable.

## Core Rules

### 1. Never Refactor Everything at Once

**Batch size: 5-20 files per batch.** Each batch must:
- Compile/build successfully
- Pass existing tests
- Be independently commitable

```
❌ "Refactor the entire core module"
✅ "Refactor core/service.js + core/session.js (2 files, batch 1)"
```

### 2. Impact Analysis Before Change

Before modifying any file in a legacy codebase:

1. **Trace imports** — who imports this file?
2. **Trace exports** — what does this file export?
3. **Check tests** — are there tests for this code?
4. **Check dependents** — what depends on the functions you're changing?

```
🍵 legacy: impact analysis

Modifying: src/core/service.js
  Imported by: src/routes/api.js, src/middleware/handler.js
  Tests: tests/service.test.js (12 tests)
  Dependents: ServiceManager, CacheLayer

Risk: MEDIUM — 2 direct importers, existing test coverage
Plan: Run tests after each change, commit per function
```

### 3. Regression Safety Net

Every batch MUST:
1. Run existing tests BEFORE starting
2. Run tests AFTER each change
3. If tests fail → STOP, don't proceed to next batch
4. Git commit after each successful batch

### 4. Backup Checkpoints

Before any legacy refactoring:
```bash
git checkout -b refactor/[module-name]
git commit -m "checkpoint: before [module] refactoring"
```

### 5. Path-Scoped Validation

Don't run full build for 1-file change:
- Changed `src/utils/format.js`? → Run `npm test -- --grep format`
- Changed `src/api/users.js`? → Run `npm test -- --grep users`
- Changed config? → Run full build

## When to Use Legacy Protocol

| Signal | Action |
|--------|--------|
| File exists > 6 months | Legacy protocol ON |
| File > 300 lines | Legacy protocol ON |
| File has > 5 importers | Legacy protocol ON |
| No tests for this file | Legacy protocol ON + write tests first |
| DB migration | Legacy protocol ON + rollback plan |

## Legacy Checklist

Before starting:
- [ ] Git branch created
- [ ] Checkpoint commit made
- [ ] Existing tests pass
- [ ] Impact analysis done
- [ ] Batch plan (which files, in what order)

During:
- [ ] One batch at a time
- [ ] Tests pass after each change
- [ ] No unrelated changes in same batch
- [ ] Decision log for each change

After:
- [ ] All tests pass
- [ ] Full build succeeds
- [ ] Code review completed
- [ ] Merge to main
