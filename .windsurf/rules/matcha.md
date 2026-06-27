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
- After writing: pause and ask "Is there a simpler path?"
- Found a better path mid-task? → STOP. Use matcha pause.

## 🧹 Cleanup
**Done = working AND clean.** No temp files, no debug code, no unused imports.
Decision log: `// matcha: [reason]`

## Intensity
- **observe**: tips only · **enforce**: full (default) · **audit**: mandatory cleanup
