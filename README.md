<p align="center">
  <img src="https://raw.githubusercontent.com/plumpslabs/matcha/main/public/matcha.png" alt="🍵 matcha" width="170" />
</p>

<h1 align="center">🍵 matcha</h1>

<p align="center">
  <em>Simple. Efficient. Deliberate. Never twice.</em>
</p>

<p align="center">
  <b>Engineering philosophy for AI coding agents.</b><br />
  5 modules · 8 commands · 6 agents · 10 hooks · 1 MCP server
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" /></a>
  <a href="https://github.com/plumpslabs/matcha"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs" /></a>
  <img src="https://img.shields.io/badge/version-2.5.6-purple" alt="v2.5.6" />
  <img src="https://img.shields.io/badge/tests-353-passing-brightgreen" alt="353 tests" />
  <img src="https://img.shields.io/badge/languages-13+-blue" alt="13+ languages" />
</p>

---

## What is matcha?

matcha is a **productivity layer** for AI coding agents. It makes agents **think before they code** — checking purpose, reusing existing code, auditing the stack, and reviewing before shipping.

**Without matcha:** Agent jumps in, writes code, realizes mid-way something was wrong.

**With matcha:** Agent stops, asks "why?", searches for existing solutions, then implements deliberately.

### The 6-Checkpoint Filter

Every implementation passes through:

```
🎯 Purpose → 🔎 Reuse → 🔍 Stack → 🛠️ Implementation → 🧹 Cleanup → ✅ Verify → 🔒 Review
```

| # | Check | What it prevents |
|---|-------|-----------------|
| 🎯 | **Purpose** | Building the wrong thing |
| 🔎 | **Reuse** | Duplicating existing code |
| 🔍 | **Stack** | Adding overlapping dependencies |
| 🛠️ | **Implementation** | Over-engineering, hardcoding |
| 🧹 | **Cleanup** | Shipping debug code, temp files |
| ✅ | **Verify** | Shipping broken code |
| 🔒 | **Review** | Shipping bad patterns, security issues |

---

## Quick Start (2 minutes)

### Option A: One-liner (any agent)

```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

Auto-detects your platform and installs the right files.

### Option B: Claude Code Plugin

```bash
/plugin marketplace add https://github.com/plumpslabs/matcha
/plugin install matcha@plumpslabs-matcha
```

### Option C: From cloned repo

```bash
git clone https://github.com/plumpslabs/matcha.git
cd matcha
node bin/matcha.js init
```

### Verify

```bash
node bin/matcha.js status
```

---

## Project Constraints (NEW in v4.0.0)

matcha now supports **project-specific rules** — things the agent must know that can't be inferred from reading code.

Create `MATCHA_PROJECT.md` in your project root:

```markdown
# Project Constraints

## Identity
You are working on: MyApp
Stack: Next.js 15, TypeScript strict, pnpm

## Hard Rules (NEVER)
- Package manager: pnpm — NEVER npm or yarn
- TypeScript strict — NO `any`, NO `@ts-ignore`
- All DB queries MUST use parameterized statements

## Ask First
- Adding new dependencies
- Database schema changes
- Modifying auth code

## Counterintuitive Patterns
- API methods return Result type — NEVER throw, NEVER try/catch
- Zustand stores: never mutate directly, always return new object
- Components: named exports only, NO default exports

## Verification Commands
- Typecheck: pnpm turbo run typecheck
- Lint: pnpm lint
- Test: pnpm vitest run
- Build: pnpm turbo run build
```

**Keep it under 80 lines.** Only rules that surprise new developers.

---

## Usage

### Daily Flow

```
Start task    → @matcha-planner (plan first)
Before code   → @matcha-finder (find existing)
While coding  → @matcha-debugger (if stuck)
After coding  → /matcha:review + @matcha-cleaner
Ship          → /matcha:review (blocking gate)
```

### Commands

| Command | Purpose |
|---------|---------|
| `/matcha:why` | 5W1H gate — answer before coding |
| `/matcha:review` | **Blocking review gate** — 8 categories |
| `/matcha:audit` | Stack health — overlaps, waste, security |
| `/matcha:intensity` | Set level: observe / enforce / audit |
| `/matcha:status` | Session dashboard |
| `/matcha:debt` | Technical debt from `// matcha:` markers |
| `/matcha:markers` | Scan markers by severity |
| `/matcha:stats` | Session metrics |

### Agents

| Agent | Role |
|-------|------|
| `@matcha-planner` | Plan through checkpoints (read-only) |
| `@matcha-finder` | Hunt existing code before writing |
| `@matcha-auditor` | Stack audit for overlaps |
| `@matcha-reviewer` | **Review gate** — blocks bad code |
| `@matcha-cleaner` | Remove temp/debug/unused |
| `@matcha-debugger` | Systematic debugging |

### Intensity Levels

| Level | Behavior |
|-------|----------|
| **observe** | Tips only. No blocking. |
| **enforce** | Full filter + review gate. **Default.** |
| **audit** | Enforce + mandatory cleanup. |

---

## MCP Server

matcha ships an MCP server for cross-platform use. It exposes matcha's checks as **tools** any MCP-capable agent can call (Claude, Cursor, Windsurf, AGY, OpenCode, Cline, Roo). **Optional** — the rules files work without it; MCP adds deterministic, programmatic enforcement.

### Setup (per-project)

Add to your MCP client config (Claude/Cursor/Windsurf/AGY format):

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

OpenCode uses a different schema — `command` must be an array:

```json
{
  "mcp": {
    "matcha": {
      "type": "local",
      "command": ["node", "hooks/matcha-mcp-server.js"],
      "enabled": true
    }
  }
}
```

### Setup (global, no absolute path)

Install the CLI once, then reference it — works from any project:

```bash
npm install -g @plumpslabs/matcha
# Claude/Cursor/Windsurf/AGY:
#   "mcpServers": { "matcha": { "command": "matcha", "args": ["mcp"] } }
# OpenCode:
#   "mcp": { "matcha": { "type": "local", "command": ["matcha", "mcp"], "enabled": true } }
```

### Tools

| Tool | Purpose |
|------|---------|
| `matcha_shield_check` | Check command for dangerous patterns |
| `matcha_post_write_scan` | Scan file for cleanup issues (13+ languages) |
| `matcha_stop_tips` | Generate tips from git diff |
| `matcha_plan_validate` | Validate 5W1H plan |

### Start manually

```bash
node hooks/matcha-mcp-server.js
# or
npm run mcp
```

---

## Hooks

| Hook | When | What it does |
|------|------|-------------|
| `matcha-shield.js` | Before tool use | Blocks dangerous commands + enforces planning gate |
| `matcha-post-write.js` | After file write | Scans for debug code, secrets, empty catches |
| `matcha-stop.js` | Task complete | Generates tips from git diff |

### Platform Support

| Platform | Integration |
|----------|-------------|
| Claude Code | `.claude/settings.json` hooks |
| OpenCode | `.opencode/plugins/matcha.mjs` |
| Any MCP client | MCP server (see above) |
| Any platform | `.agents/` universal format |

---

## Multi-Language Support

matcha checks work across **13+ languages**:

JS · TypeScript · Go · Python · Rust · Java · C# · C/C++ · Ruby · Swift · PHP · Kotlin · Dart

Plus SQL queries and prose (markdown) writing quality.

---

## Architecture

```
Source of Truth:
├── AGENTS.md                    ← Primary cross-tool file
├── skills/matcha/
│   ├── SKILL.md                 ← Router (references modules)
│   └── modules/
│       ├── core.md              ← 6-checkpoint filter + modes
│       ├── project.md           ← Project constraints (fill in once)
│       ├── modes.md             ← Context-aware mode switching
│       ├── risk.md              ← Risk-based review routing (L0-L3)
│       ├── legacy.md            ← Legacy code protocol

├── hooks/
│   ├── patterns.json            ← Multi-language pattern registry (13+)
│   ├── matcha-trigger-packs.json ← Domain-specific risk signals
│   ├── matcha-mcp-server.js     ← MCP server (4 tools)
│   ├── matcha-shield.js         ← Safety gate + mode detection
│   ├── matcha-post-write.js     ← Cleanup enforcement
│   ├── matcha-stop.js           ← End-of-task tips
│   └── matcha-metrics.js        ← Session metrics tracking
├── commands/                    ← 8 slash commands
└── .agents/agents/              ← 6 agent definitions
```

### Build System

```bash
npm run build          # Generate all platform adapters from source
npm run build:check    # Build + verify copies in sync
```

---

## Companion Tools

- 🐻 **[Kuma](https://github.com/plumpslabs/kuma)** — Runtime safety enforcement (MCP server)
- 🦊 **[Fennec](https://github.com/plumpslabs/fennec)** — AI-native developer observability (MCP server)

**The stack:** matcha 🍵 (philosophy) + kuma 🐻 (safety) + fennec 🦊 (observability)

---

## Benchmarks

```bash
npm run benchmark              # Compliance score
npm run benchmark:agentic      # A/B/C comparison (baseline vs terse vs matcha)
npm run benchmark:agentic-live # Live Claude Code sessions
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
npm test              # Run tests
npm run build         # Rebuild adapters
npm run build:check   # Verify everything in sync
```

---

## License

MIT © [plumpslabs](https://github.com/plumpslabs)

---

<p align="center">
  <b>Simple. Efficient. Deliberate. Never twice.</b>
</p>
