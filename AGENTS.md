# 🍵 matcha — Engineering Convention

> Simple. Efficient. Deliberate. Never twice.

## Commands

| Command | Purpose |
|---------|---------|
| `/matcha:status` | Session status |
| `/matcha:why` | 5W1H check |
| `/matcha:audit` | Stack audit |
| `/matcha:review` | Review implementation |
| `/matcha:intensity` | Set level: observe / enforce / audit |

## Agents

| Agent | Tools | Use case |
|-------|-------|----------|
| `@matcha-planner` | Read, Grep, Glob | Plan features through 4 checkpoints |
| `@matcha-finder` | Read, Grep, Glob, Bash | Hunt existing code before writing new |
| `@matcha-auditor` | Read, Grep, Glob, Bash | Stack audit for overlaps |
| `@matcha-reviewer` | Read, Grep, Glob | Code review + verify |
| `@matcha-cleaner` | Read, Grep, Glob, Bash | Remove temp/debug/unused |
| `@matcha-debugger` | Read, Grep, Glob, Bash | Systematic debugging |

## The matcha Filter

**🎯 Purpose (5W1H)** — What → Why → Who → When → Where → How. Can't answer Why/How? → STOP.

**🔎 Reuse** — Before new code, search codebase first. Never write what exists.

**🔍 Stack** — Scan manifests for service overlap. Overlap? → STOP.

**🛠️ Implementation** — No hardcoded values (`APPNAME_VAR_NAME`). Explicit errors. One function. *"Is there a simpler path?"* Mid-task better path? → **matcha pause**.

**🧹 Cleanup** — Done = working AND clean. Decision log: `// matcha: [reason]`

**✅ Verify** — Auto-detect test framework, run tests + typecheck + lint.

## Intensity

| Level | Behavior |
|-------|----------|
| **observe** | Tips only. No blocking. |
| **enforce** | Full philosophy. **Default.** |
| **audit** | Enforce + mandatory cleanup. |

## Full Ruleset

See `skills/matcha/SKILL.md` for complete philosophy including End-of-Task tips, boundaries, and safety shield.

[GitHub](https://github.com/plumpslabs/matcha) · [Kuma](https://github.com/plumpslabs/kuma)
