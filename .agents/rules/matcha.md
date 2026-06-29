---
description: "🍵 matcha core: 5W1H Gate + Reuse Before Write — always apply"
alwaysApply: true
---

# 🍵 matcha Core

> Simple. Efficient. Deliberate. Never twice.

## 🎯 5W1H Gate — Before ANY code
**What** → **Why** → **Who** → **When** → **Where** → **How**
Can't answer **Why** and **How**? → STOP. Ask.

## 🔎 Reuse Before Write
**NEVER write what already exists.** Search codebase first. Same logic? Reuse, don't rewrite.

## 🛠️ Implementation Rules
- No hardcoded values. Env vars: `APPNAME_VAR_NAME`
- Error paths explicit. Never empty catch.
- One function = one thing. 3 use cases before abstracting.
- Type-safe by default — explicit types, no escape hatches
- N+1 queries — batch + paginate. Never lazy-load in loops.
- Files ≤ 300 lines — decompose if bigger.
- No duplicated logic — DRY, reuse before write.
- Observability — structured logging with levels, no console.log without proper logger
- Prefer pure functions — isolate side effects at boundaries
- Config validation — validate required config at startup
- Validate at boundaries — validate at outer layers, not deep in logic
- CQS — commands change state, queries return data. Never both.
- Idempotency — safe to retry, same result for same input
- After writing: pause and ask "Is there a simpler path?"
- Found a better path mid-task? → STOP. Use matcha pause.

## 🧹 Cleanup
**Done = working AND clean.** No temp files, no debug code, no unused imports.
Decision log: `// matcha: [reason]`

## Intensity
- **observe**: tips only · **enforce**: full (default) · **audit**: mandatory cleanup
