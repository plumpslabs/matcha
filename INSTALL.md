# 🍵 matcha — Complete Installation Guide

> Install matcha for your AI coding agent. Works with any provider.

---

## Quick Start (Universal)

```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

This auto-detects your platform and installs:
- ✅ Agent definitions (6 agents)
- ✅ Slash commands (7 commands)
- ✅ Skill modules (5 modules)
- ✅ Lifecycle hooks (4 hooks — shield, post-write, stop, metrics)
- ✅ MCP server (4 tools)
- ✅ AGENTS.md (cross-tool file)

---

## Provider-Specific Setup

### 🟠 Claude Code

**Method:** Plugin Marketplace (recommended)

```bash
/plugin marketplace add https://github.com/plumpslabs/matcha
/plugin install matcha@plumpslabs-matcha
```

**What gets installed:**
- `.claude/agents/*.md` — 6 agent definitions
- `.claude/commands/*.md` — 7 slash commands
- `.claude/skills/matcha/SKILL.md` — skill file
- `.claude/settings.json` — hooks (merged, not overwritten)
- `hooks/*.js` — lifecycle hooks

**MCP Setup:** Per-project (in project root)

Create `.mcp.json` in your project root:
```json
{
  "mcpServers": {
    "matcha": {
      "command": "node",
      "args": ["hooks/matcha-mcp-server.js"]
    }
  }
}
```

**Or global** (all projects) — **recommended: use the global CLI, no absolute paths**:

```bash
npm install -g @plumpslabs/matcha
# Then add to ~/.claude.json:
# {
#   "mcpServers": {
#     "matcha": { "command": "matcha", "args": ["mcp"] }
#   }
# }
```

> ✅ **Why this is better:** `matcha mcp` resolves via your global PATH — it works from ANY project, no absolute path to update when you switch directories. The server reads its own location automatically.
>
> ⚠️ Absolute path fallback: `"args": ["/absolute/path/to/matcha/hooks/matcha-mcp-server.js"]` only if you did NOT install the CLI globally.

---

### 🔵 OpenCode

**Method:** Auto-detect install

```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

**What gets installed:**
- `.opencode/agents/*.md` — 6 agent definitions
- `.opencode/skills/matcha/SKILL.md` — skill file
- `.opencode/plugins/matcha.js` — OpenCode plugin
- `hooks/*.js` — lifecycle hooks

**MCP Setup:** Per-project or global

> ⚠️ OpenCode's `mcp` schema requires `command` to be an **array** (executable + args together).
> Do NOT use `"command": "node"` + `"args": [...]` — OpenCode rejects it with `Expected "array". Property args is not allowed`.

Per-project — add to `opencode.json` / `opencode.jsonc` in project root:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "matcha": {
      "type": "local",
      "command": ["node", "hooks/matcha-mcp-server.js"],
      "enabled": true
    }
  }
}
```

Global — add to `~/.config/opencode/opencode.json` (**recommended: global CLI, no absolute path**):

```bash
npm install -g @plumpslabs/matcha
# Then add to ~/.config/opencode/opencode.json:
# {
#   "mcp": {
#     "matcha": {
#       "type": "local",
#       "command": ["matcha", "mcp"],
#       "enabled": true
#     }
#   }
# }
```

> ✅ `matcha mcp` resolves via global PATH — works from ANY project, no absolute path to maintain when switching directories.
>
> ⚠️ Absolute path fallback: `"command": ["node", "/absolute/path/to/matcha/hooks/matcha-mcp-server.js"]` if the CLI is not installed globally.

---

### 🟣 agy (Antigravity CLI)

**Method:** Plugin install

```bash
agy plugin install https://github.com/plumpslabs/matcha
```

**What gets installed:**
- `.agents/agents/*.md` — 6 agent definitions
- `.agents/commands/*.md` — 7 slash commands
- `.agents/skills/matcha/SKILL.md` — skill file
- `AGENTS.md` — cross-tool file

**MCP Setup:** Add to your MCP config

```json
{
  "mcpServers": {
    "matcha": {
      "command": "node",
      "args": ["/path/to/matcha/hooks/matcha-mcp-server.js"]
    }
  }
}
```

---

### ⚫ Cursor

**Method:** Auto-detect (reads AGENTS.md natively)

```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

**What gets installed:**
- `AGENTS.md` — Cursor reads this natively
- `.agents/` — universal format

**MCP Setup:** Per-project or global

Per-project — create `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "matcha": {
      "command": "node",
      "args": ["hooks/matcha-mcp-server.js"]
    }
  }
}
```

Global — `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "matcha": {
      "command": "node",
      "args": ["/absolute/path/to/matcha/hooks/matcha-mcp-server.js"]
    }
  }
}
```

---

### 🌊 Windsurf

**Method:** Auto-detect (reads .windsurfrules)

```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

**What gets installed:**
- `.windsurfrules` — Windsurf reads this natively

**MCP Setup:** Global only

`~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "matcha": {
      "command": "node",
      "args": ["/absolute/path/to/matcha/hooks/matcha-mcp-server.js"]
    }
  }
}
```

---

### 🔷 Kiro

**Method:** Auto-detect (reads .kiro/steering/)

```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

**What gets installed:**
- `.kiro/steering/matcha.md` — steering file
- `.kiro/steering/dev-mode.md` — dev mode
- `.kiro/steering/review-mode.md` — review mode

**MCP Setup:** Per-project

Create `.kiro/mcp.json` (if supported) or add to your MCP config:
```json
{
  "mcpServers": {
    "matcha": {
      "command": "node",
      "args": ["hooks/matcha-mcp-server.js"]
    }
  }
}
```

---

### 🔧 Cline / Roo Code

**Method:** Auto-detect

```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

**MCP Setup:**

Cline — `~/.cline/mcp.json`:
```json
{
  "mcpServers": {
    "matcha": {
      "command": "node",
      "args": ["/absolute/path/to/matcha/hooks/matcha-mcp-server.js"],
      "disabled": false
    }
  }
}
```

Roo Code — `.roo/mcp.json` (per-project):
```json
{
  "mcpServers": {
    "matcha": {
      "command": "node",
      "args": ["hooks/matcha-mcp-server.js"],
      "alwaysAllow": ["matcha_shield_check", "matcha_post_write_scan"]
    }
  }
}
```

---

## MCP: Global vs Per-Project

| Provider | Global Path | Per-Project Path | Recommended |
|----------|------------|-----------------|-------------|
| Claude Code | `~/.claude.json` | `.mcp.json` | Per-project |
| Cursor | `~/.cursor/mcp.json` | `.cursor/mcp.json` | Per-project |
| Cline | `~/.cline/mcp.json` | VS Code settings | Global |
| Roo Code | VS Code storage | `.roo/mcp.json` | Per-project |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | ❌ Not supported | Global |
| OpenCode | `~/.config/opencode/opencode.json` | `opencode.json` | Either |

**Recommendation:** Use **per-project** MCP config. This way:
- Each project has its own matcha version
- No global path dependency
- Easy to remove (just delete `.mcp.json`)
- Works with team repos (commit `.mcp.json`)

---

## Post-Install Verification

```bash
# Check installation
node bin/matcha.js status

# Should show:
# Version: v2.5.15
# Platform: [your platform]
# AGENTS.md: ✅
# Shield: ✅ active
# Intensity: enforce
```

---

## Project Constraints (Optional but Recommended)

Create `MATCHA_PROJECT.md` in your project root:

```markdown
# Project Constraints

## Identity
You are working on: [project name]
Stack: [languages, frameworks]

## Hard Rules (NEVER)
- [rule 1]
- [rule 2]

## Ask First
- [when to ask user]

## Counterintuitive Patterns
- [thing that surprises new devs]

## Verification Commands
- Typecheck: [command]
- Test: [command]
```

**Keep under 80 lines.** Only non-inferable rules.

---

## Uninstall

```bash
# Remove matcha files
rm -rf .claude/agents/matcha-*.md
rm -rf .claude/commands/matcha-*.md
rm -rf .claude/skills/matcha/
rm -rf .opencode/agents/matcha-*.md
rm -rf .opencode/skills/matcha/
rm -rf .agents/agents/matcha-*.md
rm -rf .agents/commands/matcha-*.md
rm -rf .agents/skills/matcha/
rm -rf .openclaw/skills/matcha/
rm -rf hooks/matcha-*.js hooks/patterns.json hooks/matcha-mcp-server.js
rm -f AGENTS.md .windsurfrules GEMINI.md
rm -f MATCHA_PROJECT.md

# Remove MCP config (if added)
# Delete matcha entry from your MCP config file
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Planning gate blocked" on simple tasks | Smart auto-skip should handle this. If not, set `MATCHA_SHIELD_OFF=true` |
| Hooks conflict with other tools | Run `node scripts/safe-merge-settings.js` to merge safely |
| MCP server not starting | Check `node hooks/matcha-mcp-server.js` manually |
| Agent not found | Run `npm run build` to regenerate adapters |
| Tests failing | Run `npm test` to see what's wrong |

---

## Need Help?

- [GitHub Issues](https://github.com/plumpslabs/matcha/issues)
- [QUICKSTART.md](QUICKSTART.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
