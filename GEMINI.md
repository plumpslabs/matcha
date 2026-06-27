# 🍵 matcha — Antigravity CLI Convention

This project uses the **matcha** engineering philosophy.

> Simple. Efficient. Deliberate. Never twice.

## Core Rules

1. **Purpose First (5W1H)** — Before any code, check What/Why/Who/When/Where/How. Stop if Why/How unclear.
2. **Reuse Before Write** — Search existing code before writing new.
3. **Stack Awareness** — Check manifests, avoid service overlap.
4. **No Hardcode** — Env vars: `APPNAME_VAR_NAME`
5. **Clean Finish** — Remove temp, debug, unused.

## Intensity

- **observe** — tips only
- **enforce** — full checkpoints (default)
- **audit** — enforce + mandatory cleanup

## Agents

@matcha-planner · @matcha-finder · @matcha-auditor · @matcha-reviewer · @matcha-cleaner · @matcha-debugger

## Safety

`hooks/matcha-shield.js` blocks dangerous commands. Override: `MATCHA_SHIELD_OFF=true`

**Full ruleset:** `AGENTS.md` → `skills/matcha/SKILL.md`
