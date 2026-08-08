# 🍵 matcha — Qwen Code Convention

This project uses the **matcha** engineering philosophy.

> Simple. Efficient. Deliberate. Never twice.

## Core Rules

1. **Purpose First (Intent Discovery)** — Confirm What/Why/How. Evidence required. Stop if Why/How unclear.
2. **Reuse Before Write** — Search existing code (`file:line`). Never duplicate.
3. **Type-Safe & Boundary Guard** — Strict types (no `any`). Validate inputs/schemas at entry points.
4. **Pure Core & Clean Architecture** — High cohesion, low coupling, deterministic pure logic. Isolate side effects.
5. **Performance & Resource Awareness** — Zero N+1/unbatched IO, avoid O(n²+) time/space complexity, prevent memory leaks, limit payload sizes (pagination/stream).
6. **Security & Data Safety** — Parameterize queries (no SQLi/XSS), env vars (`APPNAME_VAR_NAME`), restrict least-privilege state access.
7. **Resilience & Explicit Errors** — Idempotent retry-safe mutations, explicit error paths, no silent catches or dummy fallbacks.
8. **Clean Finish & No Debt Leakage** — Done = working AND clean. Mark shortcuts with `// matcha: [reason]` **at write time** — a comment documenting a deliberate choice (skip/workaround/intentional hardcode) gets the prefix while writing; plain "what this does" comments need none.
9. **Loop Guardrail (Self-Termination)** — Halt & ask for guidance if 2 consecutive attempts fail or repeat.
10. **Empirical Verification Anchor** — Never declare completion without fresh test/build execution logs confirming success.

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

