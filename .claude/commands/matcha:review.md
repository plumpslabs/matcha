---
description: "🍵 Review gate — risk-based code review (L0-L3). Nothing ships until this passes"
---
# /matcha:review

**The gate between code and "done".** Nothing ships until this passes.

## Gate Execution (risk-tiered)

- **L0/L1 — async/non-blocking.** Agent continues with the next low-risk step while the review runs; the verdict lands in background (`.agents/reports/reviewer-<YYYY-MM>.md`). A 🔴 finding escalates to blocking.
- **L2/L3 — blocking.** Agent stops until verdict PASS (L2) or EXPERT_REQUIRED sign-off (L3).

Always run `matcha_review_validate` on the rendered verdict before finalizing — malformed verdicts are caught at write time, not later.

## Risk-Based Routing

Not all code needs the same review. Matcha auto-detects risk tier and routes accordingly:

| Tier | Risk | What | Review |
|------|------|------|--------|
| **L0** | Disposable | Spikes, scripts, temp | Output check only |
| **L1** | Low | Copy, fixtures, UI text | Lint + typecheck |
| **L2** | Product Lo
...
See commands/matcha:review.md for full