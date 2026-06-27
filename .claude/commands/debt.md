# /matcha:debt

Harvest all `matcha:` shortcuts in the codebase into a technical debt ledger.

## Format

When taking a shortcut, annotate with:
```
// matcha: [ceiling], [upgrade path]
// matcha: only works for authenticated routes, replace with proper RBAC later
```

## Instructions for agent

1. Scan the entire codebase for `matcha:` comments
2. For each match, extract: file path, line number, ceiling, upgrade path
3. Group by severity (missing upgrade path = HIGH, complete entry = LOW)
4. Print report:

```
🍵 matcha: debt

Total shortcuts: 5
HIGH (no upgrade path): 1
LOW (complete entry): 4

src/auth/login.ts:42
  → only works for authenticated routes
  → replace with proper RBAC later

src/db/migrate.ts:17
  → assumes PostgreSQL 15+
  → no upgrade path specified (HIGH)

Recommendation:
  - Add upgrade paths to HIGH items
  - Review debt quarterly via /matcha:debt
```