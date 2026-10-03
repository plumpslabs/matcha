---
name: review
description: >-
  Trigger blocking matcha review gate (L0-L3: Correctness, Security, Performance, Architecture).
---

# /matcha:review · Risk-Tiered Review Gate

Run the matcha review gate on the current change or git diff. Auto-routes by blast radius:
- **L0**: Output check (docs, comments, styling) — **async/non-blocking**: agent continues, verdict lands in background.
- **L1**: Lint + logic check (standard source files) — **async/non-blocking**: agent continues, verdict lands in background.
- **L2**: Full review (correctness, security, performance, architecture) — **blocking**: stop until PASS.
- **L3**: Expert + threat model (auth, payments, DB migrations, crypto) — **blocking**: EXPERT_REQUIRED.

## Instructions for Agent
Invoke `@matcha-reviewer` or inspect git diff against review checklist. Report findings with actionable remedies.
Always run `matcha_review_validate` on the rendered verdict before finalizing (auto-check, catches malformed verdicts at write time).
