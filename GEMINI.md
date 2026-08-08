# 🍵 matcha — Antigravity CLI Convention

This project uses the **matcha** engineering philosophy.

> Simple. Efficient. Deliberate. Never twice.

## Core Rules

0. **⚖️ Proportionality (effort ↔ risk)** — Match ceremony to task size. Trivial (≤5 LOC, 1 file, no logic): minimal plan, fast pass. Small (1-3 files): short plan + light review. Large (cross-cutting/prod risk): full gate. Planning > implementation = over-planning. Exit conditions beat STOP — proceed on a recorded assumption rather than blocking on trivia.
1. **Purpose First (Intent Discovery)** — Before any code, confirm What/Why/How. Evidence required. Stop if Why/How unclear — unless trivial, then proceed on a recorded assumption.
2. **Reuse Before Write** — Search existing code (`file:line`). Never duplicate.
3. **Type-Safe & Boundary Guard** — Strict types (no `any`). Validate inputs/schemas at entry points.
4. **Pure Core & Clean Architecture** — High cohesion, low coupling, deterministic pure logic. Isolate side effects.
5. **Performance & Resource Awareness** — Zero N+1/unbatched IO, avoid O(n²+) time/space complexity, prevent memory leaks, limit payload sizes (pagination/stream).
6. **Security & Data Safety** — Parameterize queries (no SQLi/XSS), env vars (`APPNAME_VAR_NAME`), restrict least-privilege state access.
7. **Resilience & Explicit Errors** — Idempotent retry-safe mutations, explicit error paths, no silent catches or dummy fallbacks.
8. **Zero Tech Debt Leakage** — Mark deliberate shortcuts with `// matcha: [reason]` **at write time** — a comment documenting a deliberate choice (skip/workaround/intentional hardcode) gets the prefix while writing; plain "what this does" comments need none.
9. **Loop Guardrail (Self-Termination)** — Halt & ask for guidance if 2 consecutive attempts fail or repeat.
10. **Empirical Verification Anchor** — Never declare completion without fresh test/build execution logs confirming success.

## Intensity

- **observe** — tips only
- **enforce** — full checkpoints (default)
- **audit** — enforce + mandatory cleanup

## Agents

@matcha-planner · @matcha-finder · @matcha-auditor · @matcha-reviewer · @matcha-cleaner · @matcha-debugger

## Session Memory

- Task start → read `.agents/plan/current.md` (resume after context loss).
- Planning gate → overwrite `.agents/plan/current.md` (living plan, never append).
- Review/Audit output → append `.agents/reports/<agent>-<YYYY-MM>.md` (keep latest 5).
- Lazy-load only — never auto-inject memory files.

## Safety

`hooks/matcha-shield.js` blocks dangerous commands. Override: `MATCHA_SHIELD_OFF=true`

**Full ruleset:** `AGENTS.md` → `skills/matcha/SKILL.md`

