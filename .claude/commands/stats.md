---
description: "🍵 Show session health statistics, metrics, and duration"
alias: ["matcha:stats", "stats"]
---
# /matcha:stats

**Session health dashboard.** Quick overview of what happened and what's left.

## Metrics Displayed

| Metric | Source | What it tells you |
|--------|--------|-------------------|
| **Files changed** | `git diff --stat` | Scope of changes |
| **Lines +/-** | `git diff --stat` | Size of changes |
| **Tests** | `npm test` | Did tests pass? |
| **Decisions** | `.agents/plan/decisions.log` | Choices made this session |
| **Markers** | `grep -r '// matcha:'` | Technical debt accumulated |
| **Intensity** | `.agents/matcha-state.json` | Current enforcement level |
| **Duration** | Session file | How long this session has been |
| **Plan status** | `.agents/matcha-plan.md` | Is planning gate satisfied? |

## Report Format

```
🍵 matcha: stats

📊 Changes:  N files (+X / -Y lines)
🧪 Tests:    N passed / N failed
📝 Decisions: N logged
🔖 Markers:  N total (HIGH:
...
See commands/stats.md for full