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

- **Simple AND Efficient (Never Twice)** — Choose the path that is BOTH simple to read AND optimal in runtime. Naive code causing future refactoring is a failure.
- **DRY & Reuse First** — Search codebase before writing (`file:line` evidence required). Never duplicate.
- **Type-Safe & Boundary Guard** — Strict types (no `any`). Validate schemas & inputs at API/function entry points (fail fast).
- **Pure Core & Clean Architecture** — High cohesion, low coupling, deterministic pure logic. Isolate side effects.
- **Performance & Resource Awareness** — Zero N+1/unbatched IO, avoid O(n²+) time/space complexity, prevent memory leaks, limit payload sizes (pagination/stream).
- **Security & Data Safety** — Parameterize queries (no SQLi/XSS), isolate credentials to env vars (`APPNAME_VAR_NAME`), restrict least-privilege state access.
- **Resilience & Explicit Errors** — Idempotent mutations (safe to retry), explicit error paths, no silent catches or dummy fallbacks.
- **Zero Tech Debt Leakage** — Mark deliberate shortcuts with `// matcha: [reason]`.
- **Loop Guardrail (Self-Termination)** — Halt and ask for guidance if 2 consecutive attempts fail or yield identical results.
- **Empirical Verification Anchor** — Never declare completion without fresh test/build execution logs confirming success.

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
