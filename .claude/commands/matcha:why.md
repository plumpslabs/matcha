---
description: "🍵 Intent Discovery — problem, goals, success criteria, What → Why → How before touching code"
---
# /matcha:why

**Intent Discovery.** Before planning or touching code, discover the intent: what problem is being solved, what success looks like, and the What → Why → How with evidence. Can't answer Why or How? → **STOP unless trivial** (≤5 LOC, 1 file, no logic change) — for trivia, proceed on a stated assumption and flag it. Never stop the user for a typo.

## Process

| Field | What to answer | Minimum evidence |
|-------|---------------|-----------------|
| **Problem** | Exact problem or request being addressed | Specific error, user request, or requirement |
| **Goals** | What success looks like | Desired outcome, acceptance behavior |
| **Success Criteria** | How we know it's done | Measurable, testable condition |
| **What** | Scope of the change | Specific files/areas affected |
| **Why** | What breaks without this | Impact, user pain, business cost |
| **How** 
...
See commands/matcha:why.md for full