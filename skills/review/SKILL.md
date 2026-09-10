---
name: review
description: >-
  Trigger blocking matcha review gate (L0-L3: Correctness, Security, Performance, Architecture).
---

# /matcha:review · Blocking Review Gate

Run the matcha review gate on the current change or git diff. Auto-routes by blast radius:
- **L0**: Output check (docs, comments, styling)
- **L1**: Lint + logic check (standard source files)
- **L2**: Full review (correctness, security, performance, architecture)
- **L3**: Expert + threat model (auth, payments, DB migrations, crypto)

## Instructions for Agent
Invoke `@matcha-reviewer` or inspect git diff against review checklist. Report findings with actionable remedies.
