---
name: matcha
description: >
  Engineering philosophy ruleset that enforces deliberate, efficient thinking
  before, during, and after any implementation.
metadata:
  version: 2.5.25
---

# 🍵 matcha — Engineering Philosophy

> Simple. Efficient. Deliberate. Never twice.

## Module Index

This skill is split into focused modules. **Lazy-load: read ONLY the modules your task needs — never pre-read the whole tree.** Standing context is a real cost (benchmark: ~10.7K tokens/turn if pre-read), so load on demand:

| Module | When to Load | Content |
|--------|-------------|---------|
| `modules/core.md` | **Always** (default) | 6-checkpoint filter, intensity, planning gate, TDD, loops, format, signals |
| `modules/project.md` | On demand — first task of a session | Project-specific constraints (fill in once per project) |
| `modules/modes.md` | On demand — only when switching modes | Context-aware mode switching (explore/implement/refactor/debug/review) |
| `modules/risk.md` | During review | Risk-based review routing (L0-L3) |
| `modules/engineering.md` | During implement + review | Universal engineering bar: errors, logging, validation, API contracts, state, concurrency |
| `modules/legacy.md` | Legacy/large codebases | Incremental batching, impact analysis, regression safety |

## Quick Reference

**Proportionality** — Match effort to risk. Trivial (≤5 LOC, 1 file, no logic): no plan, fast pass. Small (1-3 files): short plan + lint review. Large (cross-cutting/prod risk): full gate. Planning > implementation = over-planning. Exit conditions beat STOP — proceed on a recorded assumption rather than blocking on trivia.

**Intent Discovery** — Problem, Goals, Success Criteria, What → Why → How. Can't answer Why/How? → STOP unless trivial.

**Reuse Before Write** — Search codebase first. Never write what exists.

**Stack Audit** — Scan manifests for overlap. Overlap? → STOP.

**Implementation** — Simple AND efficient (Never twice). Strict types, boundary guard, pure core, security parameterized, resource & memory aware, explicit errors.

**Cleanup** — Done = working AND clean. Decision log: `// matcha: [reason]`

**Verify** — Run test + typecheck + lint. Never claim success without fresh green logs.

**Loop Guardrail** — Halt & ask if 2 consecutive edit attempts fail or repeat.

**Session Memory** — Persist gate artifacts: plan → `.agents/plan/current.md` (overwrite), review/audit → `.agents/reports/<agent>-<YYYY-MM>.md` (append). Task ships on review PASS → reviewer archives the plan + resets `current.md` (only PASS resets). Lazy-load only.

## Intensity

| Level | Behavior |
|-------|----------|
| **observe** | Tips only. No blocking. |
| **enforce** | Full philosophy. **Default.** |
| **audit** | Enforce + mandatory cleanup. |

**Full ruleset:** See `modules/core.md` for complete checkpoint details.
