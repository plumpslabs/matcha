# 🍵 matcha — Quick Start

5 minutes to matcha on any AI coding agent.

---

## 1. Install

Choose your method:

### A) curl (any AI agent)

```bash
# One-liner — auto-detect + install to current project
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash

# Or to another project
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash -s -- --target /path/to/your-project
```

The script detects `.claude/`, `.cursor/`, `.kiro/`, etc. and installs the right files.

### B) Claude Code Plugin (Claude Code only, global + auto-update)

```bash
/plugin marketplace add https://github.com/plumpslabs/matcha
/plugin install matcha@plumpslabs-matcha
```

### C) Antigravity CLI / agy

```bash
# curl method auto-detects .agents/ and installs skills + rules
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash

# Or for global agy skill (works in all projects)
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash -s -- --target ~/.gemini/antigravity-cli
```

## 2. Verify

Open your AI agent and run:

```
/matcha:status
```

You should see intensity level, available agents, and commands listed.

## 4. Daily Flow

```
Planning       → @matcha-planner or /matcha:why
Before coding  → @matcha-finder (reuse check)
While coding   → @matcha-debugger (stuck on bug?)
After coding   → /matcha:review + @matcha-reviewer + @matcha-cleaner
Deploy         → /matcha:audit
Check status   → /matcha:status
Intensity      → /matcha:enforce (default)
```

## 5. Done

matcha now enforces the 5-checkpoint filter on every task. The AI will:

- Ask **Why** and **How** before starting
- Search for existing code before writing new
- Check for service/dependency overlap
- Review for hardcoded values, error handling, simplicity
- Clean up temp files, debug code, unused imports
- Give 3 context-aware suggestions at the end

---

## What's Next

| Resource | Link |
|----------|------|
| Full philosophy | `skills/matcha/SKILL.md` |
| Agent reference | `.claude/agents/` |
| Command reference | `commands/` |
| Language rules | `rules/` |
| Full guide | `ai-agent-guide.md` |

Need help? Open an issue at [github.com/plumpslabs/matcha](https://github.com/plumpslabs/matcha).
