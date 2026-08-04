---
description: "🍵 Master session health dashboard — intensity, git diff stats, test status, and marker ledger"
alias: ["matcha:status", "status"]
---
# /matcha:status

Master session health dashboard.

## Instructions for agent

Report:
1. **Intensity level** — current (observe/enforce/audit), defaults to enforce
2. **Git Diff Stats** — files changed, lines +/- (`git diff --stat`)
3. **Test Status** — fresh test runner execution summary
4. **Markers & Debt** — count of `// matcha:` markers found in session
5. **Health Verdict** — overall session health (Healthy / Needs Attention / Critical)

```
🍵 matcha: status

Intensity:  [observe|enforce|audit]
Changes:    N files (+X / -Y lines)
Tests:      N passed / N failed
Markers:    N total (HIGH: N, MEDIUM: N)
Plan:       [satisfied/missing]

Health:     ✅ Healthy | ⚠️ Needs Attention | 🔴 Critical
```

