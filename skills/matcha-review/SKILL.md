---
name: matcha-review
description: >
  Trigger a blocking matcha review gate — L0 output check, L1 lint, L2 full
  review, L3 expert threat model. Blocks merge if critical issues found.
---

# /matcha-review · Blocking Review Gate

Invoke this to run the `@matcha-reviewer` agent on the current diff or file.

**Review levels (auto-routed by blast radius):**
- **L0** — Output check (docs, config, trivial edits)
- **L1** — Lint + logic check (standard source files)
- **L2** — Full review: correctness, security, performance, architecture
- **L3** — Expert + threat model (auth, payments, DB migrations, crypto)

**Usage:** type `/matcha-review` or mention `@matcha-reviewer` in chat.
