---
description: "🍵 Master session health dashboard — intensity, git diff stats, test status, and marker ledger"
---
# /matcha:status

Master session health dashboard.

**When to use:** mid-session health check or before declaring done — intensity, git diff, tests, markers, and plan status in one view.

## Instructions for agent

Report:
1. **Intensity level** — current (observe/enforce/audit), defaults to enforce
2. **Git Diff Stats** — files changed, lines +/- (`git diff --stat`)
3. **Test Status** — fresh test runner execution summary
4. **Markers & Debt** — count of `// matcha:` markers found in session
5. **Plan Status** — read `.agents/plan/current.md` — steps done K/N (via `[x]`), `**▶ Current**` step, and is the live plan in sync with current work?
6. **Metrics (if `.agents/matcha-metrics.json` exists)** — planning-gate blocks, shield blocks, reviews run, issues caught, FP rate. Read the JSON directly and report the numbers — this is how matcha proves its own overhead. Zero bl
...
See commands/matcha:status.md for full