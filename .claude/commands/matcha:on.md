---
description: "🍵 Enable matcha governance and safety guardrails"
---
# /matcha:on

Enable all matcha governance hooks. Use this when starting real feature work, fixing bugs, or whenever you want structured, deliberate coding with guardrails active.

**When to use:**
- Starting a new feature or bug fix session
- After using `/matcha:off` for a quick experiment and returning to normal dev
- When working on production-critical code that needs review gates

**What activates:**
- **Planning Gate** — blocks code edits until `.agents/plan/current.md` has an active Intent Discovery plan
- **Safety Shield** — blocks destructive commands (`rm -rf`, `git push --force`, `git reset --hard`, etc.)
- **Post-Write Scan** — checks for DRY violations and `// matcha:todo` debt markers after each file write
- **Stop Tips** — session health summary when agent stops
- **Rule Injection** — matcha principles injected into agent context

## Instructions for agent

1. Write to `.agents/matcha-state.json` (c
...
See commands/matcha:on.md for full