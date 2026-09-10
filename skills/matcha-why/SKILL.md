---
name: matcha-why
description: >
  Run Intent Discovery — answer What/Why/How before touching code. Triggers
  the @matcha-planner agent to map intent, reuse evidence, and roadmap.
---

# /matcha-why · Intent Discovery

Invoke this to run `@matcha-planner` — the planning gate before any code change.

**The planner answers:**
- **What** is the goal? (precise scope, not vague)
- **Why** is this change needed? (business/tech driver)
- **How** to implement? (reuse evidence from codebase, alternatives considered)

Output is written to `.agents/plan/current.md` before any file edit.

**Usage:** type `/matcha-why` or mention `@matcha-planner` in chat.
