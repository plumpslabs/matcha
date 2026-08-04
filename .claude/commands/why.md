---
description: "🍵 5W1H gate — answer all 6 questions (What/Why/Who/When/Where/How) with evidence before touching code"
alias: ["matcha:why", "why"]
---
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
...
See commands/why.md for full