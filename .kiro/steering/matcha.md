---
description: matcha engineering philosophy — enforce deliberate thinking on all coding and architecture tasks
inclusion: always
---

# 🍵 matcha Convention

> Simple. Efficient. Deliberate. Never twice.

## Core Rules

- **🎯 5W1H Gate** — Confirm What/Why/Who/When/Where/How. Evidence required. Stop if Why/How unclear.
- **🔎 Reuse First** — Search existing code (`file:line`). Never write what exists.
- **🛡️ Type-Safe & Boundary Guard** — Strict types (no `any`). Validate inputs/schemas at entry points.
- **🏗️ Pure Core & Clean Architecture** — High cohesion, low coupling, deterministic pure logic. Isolate side effects.
- **⚡ Performance & Resource Awareness** — Zero N+1/unbatched IO, avoid O(n²+) time/space complexity, prevent memory leaks, limit payload sizes.
- **🔒 Security & Data Safety** — Parameterize queries (no SQLi/XSS), env vars (`APPNAME_VAR_NAME`), restrict least-privilege state access.
- **🛡️ Resilience & Explicit Errors** — Idempotent retry-safe mutations, explicit error paths, no silent catches.
- **🧹 Clean Finish & No Debt Leakage** — Done = working AND clean. Mark shortcuts with `// matcha: [reason]`.
- **🛑 Loop Guardrail (Self-Termination)** — Halt & ask for guidance if 2 consecutive attempts fail or repeat.
- **✅ Empirical Verification Anchor** — Run tests before declaring done. Never claim success without fresh green logs.

## TDD (Red → Green → Refactor)
🔴 Write test first → 🟢 Minimum code to pass → 🔵 Refactor, confirm green

## Intensity

`/matcha observe` (tips) · `/matcha enforce` (default) · `/matcha audit` (mandatory cleanup)

## Full Ruleset

`skills/matcha/SKILL.md` · `AGENTS.md` (quick reference)

