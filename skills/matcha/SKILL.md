---
name: matcha
description: >
  Engineering philosophy ruleset that enforces deliberate, efficient thinking
  before, during, and after any implementation.
metadata:
  version: 2.5.6
---

# 🍵 matcha — Engineering Philosophy

> Simple. Efficient. Deliberate. Never twice.

## Module Index

This skill is split into focused modules. Load the relevant module for the task:

| Module | When to Load | Content |
|--------|-------------|---------|
| `modules/core.md` | **Always** (default) | 6-checkpoint filter, intensity, planning gate, TDD, loops, format, signals |
| `modules/project.md` | **Always** | Project-specific constraints (fill in once per project) |
| `modules/modes.md` | **Always** | Context-aware mode switching (explore/implement/refactor/debug/review) |
| `modules/risk.md` | During review | Risk-based review routing (L0-L3) |
| `modules/legacy.md` | Legacy/large codebases | Incremental batching, impact analysis, regression safety |

## Quick Reference

**5W1H Gate** — What → Why → Who → When → Where → How. Can't answer Why/How? → STOP.

**Reuse Before Write** — Search codebase first. Never write what exists.

**Stack Audit** — Scan manifests for overlap. Overlap? → STOP.

**Implementation** — No hardcode. Explicit errors. One function. "Is there a simpler path?"

**Cleanup** — Done = working AND clean. Decision log: `// matcha: [reason]`

**Verify** — Auto-detect test framework, run tests + typecheck + lint.

## Intensity

| Level | Behavior |
|-------|----------|
| **observe** | Tips only. No blocking. |
| **enforce** | Full philosophy. **Default.** |
| **audit** | Enforce + mandatory cleanup. |

**Full ruleset:** See `modules/core.md` for complete checkpoint details.
