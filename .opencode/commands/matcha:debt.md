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
  explain: N (LOW) — documented shortcuts
  todo:    N (MEDIUM) — future tasks
  debt:    N (HIGH) ← action required
  adr:     N (INFO) — architecture decisions

Debt ratio: HIGH / TOTAL = X%

🔴 HIGH items (resolve before merge):
  file:line — [reason] → [fix when]

🟡 MEDIUM items (track for next sprint):
  file:line — [task]

Health: ✅ CLEAN | ⚠️ DEBT ACCUMULATING | 🔴 CRITICAL DEBT
```

```

## Debt Budget

| Ratio | Status |
|-------|--------|
| HIGH/TOTAL < 10% | ✅ Healthy |
| HIGH/TOTAL 10-30% | ⚠️ Needs attention |
| HIGH/TOTAL > 30% | 🔴 Critical — prioritize debt reduction |
