# /matcha:debt

Harvest all `matcha:` shortcuts in the codebase into a technical debt ledger.

## Multi-Level Format

When taking a shortcut, annotate with the appropriate level:

```
// matcha:explain [reason]                    → explain a decision (logged in ADR)
// matcha:debt [reason], [fix when]            → technical debt (tracked by /matcha:debt)
// matcha:todo [task]                          → future task (tracked by /matcha:debt)
// matcha:adr [ADR-NUMBER]                     → links to an existing ADR
```

## Examples

```typescript
// matcha:explain skip validation, trust API gateway
// matcha:debt workaround for legacy API, fix when migrating to v2
// matcha:todo refactor when rate limiter library available
// matcha:adr ADR-001
```

## Instructions for agent

1. Scan the entire codebase for `matcha:` comments — all levels
2. For each match, extract: file path, line number, level, message
3. Group by level:
   - `// matcha:explain` — LOW (logged, no action needed)
   - `// matcha:debt` — HIGH (tracked as debt, needs resolution)
   - `// matcha:todo` — MEDIUM (future task, no urgency)
   - `// matcha:adr` — INFO (references an ADR)
4. Print report:

```
🍵 matcha: debt

Total shortcuts: 8
  explain: 3 (LOW)
  debt: 2 (HIGH)
  todo: 2 (MEDIUM)
  adr: 1 (INFO)

HIGH (debt):
  src/auth/login.ts:42
    → workaround for legacy API
    → fix when migrating to v2

  src/db/migrate.ts:17
    → assumes PostgreSQL 15+
    → no upgrade path specified

MEDIUM (todo):
  src/utils/parser.ts:88
    → refactor when rate limiter library available

Recommendation:
  - Resolve HIGH items next sprint
  - Review debt quarterly via /matcha:debt
```