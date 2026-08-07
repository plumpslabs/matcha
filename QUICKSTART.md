# 🍵 matcha — Quick Start

Get matcha running in 2 minutes.

---

## 1. Install

Choose one:

### A) One-liner (recommended — any AI agent)

```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

Auto-detects your platform. Installs hooks, agents, commands, and MCP server.

### B) Claude Code Plugin

```bash
/plugin marketplace add https://github.com/plumpslabs/matcha
/plugin install matcha@plumpslabs-matcha
```

### C) From cloned repo

```bash
git clone https://github.com/plumpslabs/matcha.git
cd matcha
node bin/matcha.js init
```

---

## 2. Verify

```bash
node bin/matcha.js status
```

Should show: version, platform detected, components installed.

---

## 3. Configure (optional but recommended)

Create `MATCHA_PROJECT.md` in your project root with project-specific rules:

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

## 4. Configure MCP (optional)

Add to your MCP client config:

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

This enables matcha enforcement on any MCP-compatible agent.

---

## 5. Daily Flow (The 4-Phase Lifecycle)

Follow this 4-phase lifecycle for every feature or bugfix:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Phase 1: PLAN  │ →  │ Phase 2: SEARCH │ →  │ Phase 3: CODE   │ →  │  Phase 4: SHIP  │
│  @matcha-planner│    │  @matcha-finder │    │ @matcha-debugger│    │ /matcha:review  │
│  (/matcha:why)  │    │  (Reuse Check)  │    │ (Systematic Fix)│    │ @matcha-cleaner │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. **Phase 1: Plan & Intent** — Call `@matcha-planner` or run `/matcha:why` to complete Intent Discovery evidence check before touching code.
2. **Phase 2: Search & Reuse** — Call `@matcha-finder` to hunt existing functions/utilities (`file:line`) before writing new code.
3. **Phase 3: Code & Debug** — Write code following 8-Pillar Engineering Directives. If stuck on an error, call `@matcha-debugger` for 1-hypothesis-at-a-time investigation.
4. **Phase 4: Review & Ship** — Run `/matcha:review` to pass risk-based gate (L0-L3) and call `@matcha-cleaner` to remove debug logs.


---

## 6. Commands

| Command | Purpose |
|---------|---------|
| `/matcha:why` | Intent Discovery |
| `/matcha:review` | Review gate (9 categories) |
| `/matcha:audit` | Stack audit |
| `/matcha:intensity` | Set level |
| `/matcha:status` | Session dashboard |
| `/matcha:debt` | Debt ledger |
| `/matcha:markers` | Scan markers |

---

## 7. Intensity

| Level | Behavior |
|-------|----------|
| **observe** | Tips only |
| **enforce** | Full filter (default) |
| **audit** | Enforce + mandatory cleanup |

Set: `/matcha:intensity` or `node bin/matcha.js state save`

---

## What's Next

| Resource | Link |
|----------|------|
| Full philosophy | `skills/matcha/SKILL.md` |
| Project constraints | `skills/matcha/modules/project.md` |
| MCP server | `hooks/matcha-mcp-server.js` |
| Agent definitions | `.agents/agents/` |
| CLI help | `node bin/matcha.js help` |

Need help? See [INSTALL.md](INSTALL.md) for complete provider-specific guides including MCP setup.

[github.com/plumpslabs/matcha](https://github.com/plumpslabs/matcha)
