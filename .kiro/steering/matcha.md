---
description: matcha engineering philosophy — enforce deliberate thinking on all coding and architecture tasks
inclusion: always
---

# 🍵 matcha Convention

> Simple. Efficient. Deliberate. Never twice.

## Core Rules

- **🎯 5W1H** — What → Why → Who → When → Where → How. Can't answer Why/How? → STOP.
- **🔎 Reuse** — Before writing code, search existing implementations first. Never write what exists.
- **🔍 Stack** — Scan manifests for service overlap. Overlap? → STOP.
- **🛠️ No hardcoded values**. Env vars: `APPNAME_VAR_NAME`. Explicit errors. One function.
- **🧹 Done = working AND clean.** Decision log: `// matcha: [reason]`

## Intensity

`/matcha observe` (tips) · `/matcha enforce` (default) · `/matcha audit` (mandatory cleanup)

## Full Ruleset

`skills/matcha/SKILL.md` · `AGENTS.md` (quick reference)
