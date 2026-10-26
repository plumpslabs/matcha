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
| **How** | Simplest full solution | Step-by-step, file-by-file plan |
| **Assumptions** | What we take as given | Constraints, existing patterns |
| **Unknowns** | What still needs discovery | Open questions → resolve in context/reuse stages |

> What/Why/How is one technique inside Intent Discovery — the container also captures problem, goals, success criteria, assumptions, and unknowns.

## Decision Matrix

| Confidence | Action |
|------------|--------|
| **HIGH** on Problem/Why/How | ✅ Proceed to planning |
| **MEDIUM** on Why or How | ⚠️ Ask user to clarify (skip for trivial tasks — proceed on assumption) |
| **LOW** on any | 🛑 STOP for nontrivial. For trivial (≤5 LOC, 1 file): proceed on a recorded assumption and flag it. Don't block a typo on missing "Why evidence". |

## Report Format

```
🍵 matcha: Intent Discovery

Task: [what was requested]

Problem:       [exact problem]
Goals:         [desired outcome]
Success:       [measurable done condition]
What:          [scope — be specific]
Why:           [impact without this — with evidence]
How:           [simplest solution — numbered steps]
Assumptions:   [what's taken as given]
Unknowns:      [what needs discovery]

Confidence: HIGH / MEDIUM / LOW

[If MEDIUM/LOW: what's unclear → ask user]
```

## Persistence

Persist the Intent Discovery into `.agents/plan/current.md` (overwrite — living plan, never append). Already a plan for this task? Update it in place; mismatch → overwrite. This satisfies the planning gate BEFORE the first code edit — never wait for a user command.

## Red Flags

If any of these appear → STOP and ask (skip for trivial tasks — ≤5 LOC, 1 file, no logic — proceed on a recorded assumption and flag it):
- "I think it might be..." → You don't know. Ask.
- "Probably related to..." → You're guessing. Verify.
- "Should be simple..." → You haven't analyzed. Think first.
- Multiple valid "How" options → Ask user for preference.
