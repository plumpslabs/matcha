<p align="center">
  <img src="https://raw.githubusercontent.com/plumpslabs/matcha/main/public/matcha.png" alt="🍵 matcha" width="170" />
</p>

<h1 align="center">🍵 matcha</h1>

<p align="center">
  <em>Simple. Efficient. Deliberate. Never twice.</em>
</p>

<p align="center">
  <b>Engineering philosophy for AI coding agents.</b><br />
  6 modules · 7 commands · 6 agents · 7 hooks · 1 MCP server
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" /></a>
  <a href="https://github.com/plumpslabs/matcha"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs" /></a>
  <img src="https://img.shields.io/badge/version-2.5.26-purple" alt="v2.5.26" />
  <img src="https://img.shields.io/badge/tests-554-passing-brightgreen" alt="554 tests" />
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
| 🎯 | **Purpose + Reuse** | Building the wrong thing, duplicating existing code |
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

## Project Constraints

matcha now supports **project-specific rules** — things the agent must know that can't be inferred from reading code.

Create `MATCHA_PROJECT.md` in your project root:

```markdown
# Project Constraints

### Example `MATCHA_PROJECT.md` (Auto-generated per project)

```markdown
# 🍵 MATCHA_PROJECT.md — Project Constraints

## 1. Stack & Architecture
- **Language / Ecosystem:** Polyglot (Rust / Go / Python / Java / JS)
- **Architecture Pattern:** Pure Core Logic, High Cohesion, Low Coupling

## 2. Verification Commands
- **Typecheck / Lint:** [native project check command]
- **Test Suite:** [native project test command]
- **Build Target:** [native project build command]
```


**Keep it under 80 lines.** Only rules that surprise new developers.

---

## Usage

### Daily Flow (The 4-Phase Lifecycle)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Phase 1: PLAN  │ →  │ Phase 2: SEARCH │ →  │ Phase 3: CODE   │ →  │  Phase 4: SHIP  │
│  @matcha-planner│    │  @matcha-finder │    │ @matcha-debugger│    │ /matcha:review  │
│  (/matcha:why)  │    │  (Reuse Check)  │    │ (Systematic Fix)│    │ @matcha-cleaner │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. **Phase 1: Plan & Intent** — `@matcha-planner` or `/matcha:why` (Intent Discovery)
2. **Phase 2: Search & Reuse** — `@matcha-finder` (hunt existing code `file:line`)
3. **Phase 3: Code & Debug** — Follow 8-Pillar Directives + `@matcha-debugger` if stuck
4. **Phase 4: Review & Ship** — `/matcha:review` (blocking L0-L3 gate) + `@matcha-cleaner`


Minimal cheat-sheet: **plan → reuse → implement → review**. Everything else is automatic or optional. Full step-by-step guide with example prompts lives in the [Workflow Guide](docs/index.html#workflow).

### Commands

| Command | Purpose |
|---------|---------|
| `/matcha:why` | Intent Discovery — answer before coding |
| `/matcha:review` | **Blocking review gate** — 9 categories |
| `/matcha:audit` | Stack health — overlaps, waste, security |
| `/matcha:intensity` | Set level: observe / enforce / audit |
| `/matcha:status` | Session dashboard |
| `/matcha:debt` | Technical debt from `// matcha:` markers |
| `/matcha:markers` | Scan markers by severity |

### Agents

| Agent | Role |
|-------|------|
| `@matcha-planner` | Plan through checkpoints (read-only) |
| `@matcha-finder` | Hunt existing code before writing |
| `@matcha-auditor` | Stack audit for overlaps |
| `@matcha-reviewer` | **Review gate** — blocks bad code |
| `@matcha-cleaner` | Remove temp/debug/unused |
| `@matcha-debugger` | Systematic debugging |

> 🔒 **Enforced permissions** (OpenCode `permission:` + Claude Code `disallowedTools:`): planner/finder/reviewer/auditor are read-only — `edit` is denied for all source code. Only plan/report files are writable (`.agents/plan/current.md`, `.agents/reports/**`). debugger/cleaner may modify code. Other providers: prompt-level + hooks.

### Intensity Levels

| Level | Behavior |
|-------|----------|
| **observe** | Tips only. No blocking. |
| **enforce** | Full filter + review gate. **Default.** |
| **audit** | Enforce + mandatory cleanup. |

### Session Memory (survive context loss)

Filesystem is durable memory; the context window is volatile. matcha persists gate artifacts so a compacted or fresh session resumes in <500 tokens:

| File | Write | Read |
|------|-------|------|
| `.agents/plan/current.md` | Planning gate → **overwrite** (living plan) | Start of every task |
| `.agents/reports/<agent>-<YYYY-MM>.md` | Review/Audit output → **append** | Resuming or auditing history |
| `.agents/plan/decisions.log` | `matcha decision <type> <reason>` | `matcha markers` / `/matcha:debt` |

- **Lazy-load only** — memory files are never auto-injected into context; read on demand.
- **Lifecycle (anti-stale)** — `current.md` holds one active task: intent mismatch at start → overwrite; done (review PASS) → reviewer archives to `reports/planner-<YYYY-MM>.md` + resets to empty template. Only PASS resets — BLOCK / PASS_WITH_FIXES keeps the plan for fix iteration.
- **Living over archive** — `current.md` overwrites, never appends. Reports append monthly; keep latest 5 per agent.
- **Format:** YAML frontmatter (`title`, `date`, `type`, `agent`, `status`, `tags`) — grep-able, git-friendly.

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
| `matcha_plan_validate` | Validate Intent Discovery plan |

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
| `planning-gate.js` | Before first edit | Blocks code until an Intent Discovery plan exists |
| `matcha-shield.js` | Before tool use | Blocks dangerous commands + mode detection |
| `matcha-post-write.js` | After file write | Scans for debug code, secrets, empty catches |
| `matcha-stop.js` | Task complete | Generates tips from git diff |
| `matcha-metrics.js` | Session | Tracks session metrics |
| `matcha-agy-hooks.js` | Antigravity tool use | Routes agy tool names to gate decisions |
| `matcha-instructions.js` | Session start | Injects matcha rules into agent context |

### Platform Support

| Platform | Integration |
|----------|-------------|
| Claude Code | `.claude/settings.json` hooks |
| OpenCode | `.opencode/plugins/matcha.js` |
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
│       ├── engineering.md       ← Universal engineering bar (errors, logging, validation, API, state)
│       ├── legacy.md            ← Legacy code protocol

├── hooks/
│   ├── patterns.json            ← Multi-language pattern registry (13+)
│   ├── matcha-trigger-packs.json ← Domain-specific risk signals
│   ├── planning-gate.js         ← Planning gate enforcement (blocks edits before plan)
│   ├── danger-checks.js         ← Danger pattern detection (shield/planning support)
│   ├── mode-detect.js           ← Context-aware mode detection
│   ├── matcha-agy-hooks.js      ← Antigravity (agy) hook adapter
│   ├── matcha-mcp-server.js     ← MCP server (4 tools)
│   ├── matcha-shield.js         ← Safety gate + mode detection
│   ├── matcha-post-write.js     ← Cleanup enforcement
│   ├── matcha-stop.js           ← End-of-task tips
│   └── matcha-metrics.js        ← Session metrics tracking
├── commands/                    ← 7 slash commands
├── .agents/agents/              ← 6 agent definitions
├── agents/ · rules/ · mcp_config.json      ← AGY plugin package (agy plugin install)
└── plugin.json · .claude-plugin/ · gemini-extension.json  ← plugin manifests
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
