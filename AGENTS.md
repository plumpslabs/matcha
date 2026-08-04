# 🍵 matcha

> Simple. Efficient. Deliberate. Never twice.

Engineering philosophy for AI coding agents. Enforces deliberate thinking before, during, and after every implementation.

## Setup

```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

## Build & Test

```bash
npm test              # Run test suite (vitest)
npm run build         # Rebuild adapter copies
npm run build:check   # Build + verify copies in sync
npm run mcp           # Start MCP server
```

## The 6-Checkpoint Filter

```
🎯 Purpose → 🔎 Reuse → 🔍 Stack → 🛠️ Implementation → 🧹 Cleanup → ✅ Verify → 🔒 Review
```

| # | Checkpoint | Rule |
|---|------------|------|
| 🎯 | **Purpose** | 5W1H with evidence. Can't answer Why/How? → STOP. |
| 🔎 | **Reuse** | Search codebase first. Never duplicate. Report `path:line`. |
| 🔍 | **Stack** | Scan manifests for overlap. Overlap? → STOP. |
| 🛠️ | **Implementation** | No hardcode. Explicit errors. One function. Simpler path? → Use it. |
| 🧹 | **Cleanup** | Done = working AND clean. Decision log: `// matcha: [reason]` |
| ✅ | **Verify** | Run tests + typecheck + lint. Fail? → STOP. |
| 🔒 | **Review** | **Blocking gate.** Catch bugs, performance, security, architecture. Nothing ships without PASS. |

## Core Principles

- **Type-safe by default** — No escape hatches.
- **Validate at boundaries** — Fail before mutation.
- **Pure functions first** — Testable without mocks.
- **Fail fast** — Validate config at startup.
- **Idempotency** — Retry-safe mutations.
- **Performance awareness** — N+1, O(n²+), re-render loops.
- **Error handling** — No empty catches, explicit paths.

## Intensity Levels

| Level | Behavior |
|-------|----------|
| **observe** | Tips only. No blocking. |
| **enforce** | Full filter + review gate. **Default.** |
| **audit** | Enforce + mandatory cleanup. Everything flagged. |

## Commands

| Command | Purpose |
|---------|---------|
| `/matcha:why` | 5W1H gate with evidence requirements |
| `/matcha:review` | **Blocking review gate** — correctness, performance, security, architecture, testing |
| `/matcha:audit` | Stack health — overlaps, waste, security, architecture |
| `/matcha:intensity` | Set level: observe / enforce / audit |
| `/matcha:status` | Session health dashboard |
| `/matcha:debt` | Technical debt ledger from `// matcha:` markers |
| `/matcha:markers` | Scan and group markers by severity |
| `/matcha:stats` | Session metrics — changes, tests, decisions, duration |

## Agents

| Agent | Role | When |
|-------|------|------|
| `@matcha-planner` | Plan features through checkpoints | Before starting work |
| `@matcha-finder` | Hunt existing code before writing new | Before implementing |
| `@matcha-auditor` | Stack audit for overlaps & health | Health checks, onboarding |
| `@matcha-reviewer` | **Blocking review gate** — catches everything | Before merge |
| `@matcha-cleaner` | Remove temp/debug/unused code | After implementation |
| `@matcha-debugger` | Systematic debugging — one hypothesis at a time | When stuck on bug |

## Safety

- `hooks/matcha-shield.js` blocks dangerous commands + auto-detects mode
- `hooks/matcha-post-write.js` scans files for cleanup issues (13+ languages)
- `hooks/matcha-stop.js` provides deterministic end-of-task suggestions
- `hooks/matcha-metrics.js` tracks session metrics (blocks, modes, reviews)
- `hooks/matcha-mcp-server.js` exposes matcha as MCP tools (4 tools)

## MCP Server

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

Tools: `matcha_shield_check`, `matcha_post_write_scan`, `matcha_stop_tips`, `matcha_plan_validate`

## Companion Tools

- 🐻 [Kuma](https://github.com/plumpslabs/kuma) — Runtime safety (MCP)
- 🦊 [Fennec](https://github.com/plumpslabs/fennec) — Developer observability (MCP)

## Full Philosophy

See `skills/matcha/SKILL.md` for complete ruleset including TDD mode, loop mode, issue format, and boundaries.

[GitHub](https://github.com/plumpslabs/matcha) · [Kuma](https://github.com/plumpslabs/kuma) · [Fennec](https://github.com/plumpslabs/fennec)
