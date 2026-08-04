# /matcha:why

**5W1H gate.** Answer all 6 before touching any code. Can't answer Why or How? → STOP.

## Process

Answer each question with **evidence**, not assumptions:

| Question | What to answer | Minimum evidence |
|----------|---------------|-----------------|
| **What** | Exact problem being solved | Specific error, user request, or requirement |
| **Why** | What breaks without this | Impact, user pain, business cost |
| **Who** | What/who depends on this | Services, users, downstream consumers |
| **When** | Is this needed NOW? | Deadline, dependency chain, blocking issue |
| **Where** | Where in stack does this belong? | Specific file, module, service |
| **How** | Simplest full solution | Step-by-step, file-by-file plan |

## Decision Matrix

| Confidence | Action |
|------------|--------|
| **HIGH** on all | ✅ Proceed |
| **MEDIUM** on Why or How | ⚠️ Ask user to clarify |
| **LOW** on any | 🛑 STOP. Don't guess. |

## Report Format

```
🍵 matcha: 5W1H

Task: [what was requested]

What:  [actual problem — be specific]
Why:   [impact without this — with evidence]
Who:   [dependents — services, users, systems]
When:  [urgency — now, next sprint, backlog]
Where: [exact location — file:line, module, service]
How:   [simplest solution — numbered steps]

Confidence: HIGH / MEDIUM / LOW

[If MEDIUM/LOW: what's unclear → ask user]
```

## Red Flags

If any of these appear → STOP and ask:
- "I think it might be..." → You don't know. Ask.
- "Probably related to..." → You're guessing. Verify.
- "Should be simple..." → You haven't analyzed. Think first.
- Multiple valid "How" options → Ask user for preference.
