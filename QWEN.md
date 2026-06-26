# 🍵 matcha — Qwen Code Convention

This project uses the **matcha** engineering philosophy.

> Simple. Efficient. Deliberate. Never twice.

## Core Rules

1. **Purpose First (5W1H)** — Before any code, confirm What/Why/Who/When/Where/How
2. **Reuse Before Write** — Search existing code first
3. **Stack Awareness** — Check for service overlap
4. **No Hardcode** — Env vars: `APPNAME_VAR_NAME`
5. **Clean Finish** — Remove temp, debug, unused

## Intensity

- `observe` — tips only
- `enforce` — full checkpoints (default)
- `audit` — enforce + mandatory cleanup

## Safety

- `hooks/matcha-shield.js` blocks dangerous commands
- Override: `MATCHA_SHIELD_OFF=true`

## Agents

@matcha-planner · @matcha-finder · @matcha-auditor · @matcha-reviewer · @matcha-cleaner · @matcha-debugger

**Full ruleset:** `AGENTS.md` → `skills/matcha/SKILL.md`
