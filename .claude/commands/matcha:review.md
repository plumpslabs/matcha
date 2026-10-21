---
description: "🍵 Review gate — risk-based code review (L0-L3). Nothing ships until this passes"
---
# /matcha:review

**The gate between code and "done".** Nothing ships until this passes.

## Gate Execution (risk-tiered)

- **L0/L1 — async/non-blocking.** Agent continues with the next low-risk step while the review runs; the verdict lands in background (`.agents/reports/reviewer-<YYYY-MM>.md`). A 🔴 finding escalates to blocking.
- **L2/L3 — blocking.** Agent stops until verdict PASS (L2) or EXPERT_REQUIRED sign-off (L3).

Always run `matcha_review_validate` on the rendered verdict before finalizing — malformed verdicts are caught at write time, not later.

## Fallback (reviewer subagent unavailable)

If `@matcha-reviewer` cannot run (rate limit, timeout, or provider error), do **not** fail the gate. Run the review **inline** using the tier checklist above (L0/L1/L2/L3) and render the same verdict format (`Risk Tier`, `Scope`, `Verdict`, counts, `file:line` evidence). Then validat
...
See commands/matcha:review.md for full