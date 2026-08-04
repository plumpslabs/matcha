# 🍵 matcha — Metrics & Feedback Loop

> Measure the impact. Prove the value. Improve continuously.

## Metrics Tracked

### Session Metrics
| Metric | Source | What it tells you |
|--------|--------|-------------------|
| **Tasks completed** | Counter | Productivity |
| **Planning time** | Timestamp | Friction overhead |
| **Review time** | Timestamp | Review thoroughness |
| **Issues found** | Review output | Bug catch rate |
| **False positives** | User feedback | Review accuracy |
| **Mode switches** | Mode detection | Workflow patterns |

### Code Quality Metrics
| Metric | Source | What it tells you |
|--------|--------|-------------------|
| **Lines changed** | Git diff | Scope of work |
| **Test coverage delta** | Test results | Quality improvement |
| **Lint issues before/after** | Lint output | Code quality trend |
| **Complexity score** | AST analysis | Maintainability |

### Impact Metrics
| Metric | Formula | What it tells you |
|--------|---------|-------------------|
| **Time saved** | (estimated without matcha) - (actual with matcha) | Efficiency gain |
| **Bugs prevented** | Issues caught in review that would have shipped | Quality impact |
| **Reuse rate** | (reused existing) / (total implementations) | Duplication prevention |
| **Compliance rate** | (passing reviews) / (total reviews) | Rule effectiveness |

## Metrics Storage

Store in `.agents/matcha-metrics.json`:

```json
{
  "sessions": [
    {
      "id": "session-123",
      "started": "2026-08-04T10:00:00Z",
      "ended": "2026-08-04T11:30:00Z",
      "tasks": 5,
      "planningTime": 120,
      "reviewTime": 90,
      "issuesFound": 3,
      "falsePositives": 0,
      "modes": { "explore": 2, "implement": 3, "review": 5 }
    }
  ],
  "totals": {
    "sessions": 42,
    "tasks": 210,
    "issuesFound": 87,
    "falsePositives": 12,
    "reuseRate": 0.65,
    "complianceRate": 0.94
  }
}
```

## CLI Commands

### View Metrics
```bash
node bin/matcha.js metrics          # Show session summary
node bin/matcha.js metrics --json   # JSON output
node bin/matcha.js metrics --trend  # Show trends over time
```

### Report Format
```
🍵 matcha: metrics

📊 Session Summary
  Tasks: 5 completed
  Planning: 2min (12% of session)
  Review: 1.5min (10% of session)
  Issues found: 3 (0 false positives)

📈 All-Time
  Sessions: 42
  Tasks: 210
  Issues caught: 87 (prevented from shipping)
  False positive rate: 14%
  Reuse rate: 65%
  Compliance rate: 94%

💡 Insights
  - Planning overhead: 12% (acceptable for enforce mode)
  - Most common issue: empty catch blocks (23% of findings)
  - Reuse rate improving: 45% → 65% over last 10 sessions
```

## Feedback Loop

### Automatic
- After each review: count issues found
- After each task: measure time
- After each session: aggregate metrics

### Manual
- User can mark false positives: `/matcha:feedback false-positive [issue]`
- User can mark helpful: `/matcha:feedback helpful [issue]`
- User can skip metric: `/matcha:feedback skip [metric]`

### Improvement Signals
| Signal | Action |
|--------|--------|
| False positive rate > 20% | Review rules — too aggressive? |
| Planning overhead > 20% | Consider reduce friction |
| Reuse rate < 30% | Agent not searching enough |
| Compliance rate < 80% | Rules too complex? |
