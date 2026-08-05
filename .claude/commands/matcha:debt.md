---
description: "🍵 Technical debt & marker ledger — harvest all // matcha: comments into an actionable report"
---
# /matcha:debt

**Technical debt & marker ledger.** Harvest all `// matcha:` markers into an actionable report.

## Marker Severity Levels

| Marker | Level | Action |
|--------|-------|--------|
| `// matcha:explain [reason]` | LOW | Logged justification — documented shortcut |
| `// matcha:todo [task]` | MEDIUM | Future task — schedule or track |
| `// matcha:debt [reason], [fix when]` | HIGH | Technical debt — must resolve before release |
| `// matcha:adr [ADR-NUMBER]` | INFO | Architecture Decision Record reference |

## Process

1. Scan codebase for `// matcha:` comments across all files using grep.
2. Extract: `file:line`, severity level, message.
3. Group items by severity level and compute debt ratio (HIGH / TOTAL).
4. Highlight HIGH items requiring immediate resolution.

## Report Format

```
🍵 matcha: debt & markers

Total markers: N
  explain: N (LOW) — docu
...
See commands/matcha:debt.md for full