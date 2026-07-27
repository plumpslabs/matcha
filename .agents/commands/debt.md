# /matcha:debt

Harvest all `matcha:` shortcuts into a technical debt ledger.

## Levels
- `// matcha:explain [reason]` — LOW (logged, no action)
- `// matcha:debt [reason], [fix when]` — HIGH (needs resolution)
- `// matcha:todo [task]` — MEDIUM (future task)
- `// matcha:adr [ADR-NUMBER]` — INFO (references ADR)

## Instructions
1. Scan codebase for `matcha:` comments — all levels
2. Extract file, line, level, message
3. Group by level, print report

## Report Format
```
🍵 matcha: debt

Total shortcuts: N
  explain: N (LOW)
  debt: N (HIGH) ← action needed
  todo: N (MEDIUM)
  adr: N (INFO)

HIGH items: resolve next sprint
MEDIUM items: review quarterly
```
