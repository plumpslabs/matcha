---
description: Technical debt ledger — harvest all `// matcha:` markers into an actionable report
---
# /matcha:debt

**Technical debt ledger.** Harvest all `// matcha:` markers into actionable report.

## Marker Levels

| Marker | Level | Action |
|--------|-------|--------|
| `// matcha:explain [reason]` | LOW | Logged. No action needed. Justification documented. |
| `// matcha:todo [task]` | MEDIUM | Future task. Schedule or create issue. |
| `// matcha:debt [reason], [fix when]` | HIGH | Must resolve. Set deadline or create issue. |
| `// matcha:adr [ADR-NUMBER]` | INFO | Architecture Decision Record reference. |

## Process

1. Scan codebase for `// matcha:` comments — all levels
2. Extract: file, line, level, message
3. Group by level
4. Calculate debt ratio (HIGH / total)
5. Prioritize resolution

## Report Format

```
🍵 matcha: debt

Total markers: N
  explain: N (LOW) — documented shortcuts
  todo:    N (MEDIUM) — future tasks
  debt:    N (HIGH) ← action needed
  adr:     
...
See commands/debt.md for full