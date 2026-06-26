# 🍵 matcha — Quick Start

1 minute to matcha on any AI coding agent.

---

## 1. Install

Choose your method:

### A) curl (any AI agent — recommended)

```bash
# One-liner — auto-detect + install to current project
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash

# Selective install — only TypeScript + React rules
curl -fsSL ... | bash -s -- --lang typescript,react

# Minimal profile — auto-detect + common rules only
curl -fsSL ... | bash -s -- --profile minimal

# To another project
curl -fsSL ... | bash -s -- --target /path/to/your-project
```

The script auto-detects **12 platforms** (`.claude/`, `.cursor/`, `.kiro/`, `.qoder/`, `.qwen/`, `.opencode/`, etc.) and installs the right files.

### B) Claude Code Plugin

```bash
/plugin marketplace add https://github.com/plumpslabs/matcha
/plugin install matcha@plumpslabs-matcha
```

### C) Antigravity CLI / agy

```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

---

## 2. Verify

```bash
# Inside your AI agent:
/matcha:status

# Or from cloned matcha repo:
node bin/matcha.js status
```

Should show: version, platform detected, components installed, shield status.

---

## 3. Daily Flow

```
Planning       → @matcha-planner  or  node bin/matcha.js why
Before coding  → @matcha-finder (reuse check — "never write twice")
While coding   → @matcha-debugger (stuck on bug?)
After coding   → /matcha:review  +  @matcha-reviewer  +  @matcha-cleaner
Verify         → @matcha-reviewer (auto-run tests + typecheck + lint)
Deploy         → /matcha:audit
Check status   → /matcha:status
Intensity      → /matcha:enforce (default)
```

---

## 4. Done

matcha now enforces the **6-checkpoint filter** on every task. The AI will:

1. 🎯 **Purpose** — ask Why/How before starting
2. 🔎 **Reuse** — search existing code before writing new
3. 🔍 **Stack** — check for service/dependency overlap
4. 🛠️ **Implementation** — no hardcode, explicit errors, simplicity review
5. 🧹 **Cleanup** — remove temp files, debug code, unused imports
6. ✅ **Verify** — auto-run tests + typecheck + lint

Plus:
- 🛡️ **matcha-shield** — blocks dangerous commands (`rm -rf /`, `DROP DATABASE`, etc.)
- 💡 **End-of-task tips** — 3 context-aware suggestions

---

## What's Next

| Resource | Link |
|----------|------|
| Full philosophy | `skills/matcha/SKILL.md` |
| CLI commands | `node bin/matcha.js help` — status, why, audit, verify |
| Agent reference | `.claude/agents/` or `.opencode/agents/` |
| Command reference | `commands/` |
| Language rules | `rules/` |

Need help? Open an issue at [github.com/plumpslabs/matcha](https://github.com/plumpslabs/matcha).
