# 🍵 matcha — Engineering Convention

> Simple. Efficient. Deliberate. Never twice.

This project uses **matcha** — an engineering philosophy that enforces deliberate,
efficient thinking before, during, and after every implementation.

---

## Quick Start

| Command | Purpose |
|---------|---------|
| `/matcha:status` | Show matcha session status |
| `/matcha:why` | Run 5W1H check on current task |
| `/matcha:audit` | Audit stack for overlaps |
| `/matcha:review` | Review implementation |
| `/matcha:intensity` | Set level: observe / enforce (default) / audit |

---

## Available Agents

| Agent | Tools | When to use |
|-------|-------|-------------|
| `@matcha-planner` | Read, Grep, Glob | Before starting features — creates plans through 4 checkpoints |
| `@matcha-finder` | Read, Grep, Glob, Bash | Before writing code — hunts for existing implementations |
| `@matcha-auditor` | Read, Grep, Glob, Bash | Stack audit — scans manifests and services for overlap |
| `@matcha-reviewer` | Read, Grep, Glob | Code review — checks simplicity, bugs, matcha compliance |
| `@matcha-cleaner` | Read, Grep, Glob, Bash | Cleanup — removes temp, debug, unused after implementation |
| `@matcha-debugger` | Read, Grep, Glob, Bash | Systematic debugging — one hypothesis at a time |

---

## The matcha Filter

### 🎯 Purpose (5W1H Gate)
**What** → **Why** → **Who** → **When** → **Where** → **How**
Can't answer Why/How? → STOP.

### 🔎 Reuse (Hunter)
Before new code: search codebase first. Same logic? Reuse, don't rewrite.

### 🔍 Stack (Audit)
Before new services: scan manifests, check overlap. Overlap? → STOP.

### 🛠️ Implementation
No hardcoded values (`APPNAME_VAR_NAME`). Explicit errors. One function = one thing.
After writing: *"Is there a simpler path?"* Mid-task better path? → **matcha pause**.

### 🧹 Cleanup
Done = working AND clean. Remove temp/debug/unused. Decision log: `// matcha: [reason]`

---

## Intensity Levels

| Level | Behavior |
|-------|----------|
| **observe** | Tips only. No blocking. |
| **enforce** | Full philosophy. **Default.** |
| **audit** | Enforce + mandatory cleanup. |

---

## Communication

```
🍵 matcha: [TITLE]
Observation: ...
Why it matters: ...
Options: A) ... B) ...
Recommendation: ...
```

---

## Full Ruleset

**See `skills/matcha/SKILL.md`** for the complete engineering philosophy including:
- End-of-task suggestions (🔴 critical + 🟡 minor)
- Boundaries (what matcha does / does not)
- Detailed checkpoint protocols
- Safety shield (matcha-shield)

---

## Related

- [Matcha on GitHub](https://github.com/plumpslabs/matcha)
- [Kuma — MCP safety toolkit](https://github.com/plumpslabs/kuma)
