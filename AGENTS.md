# 🍵 matcha — Core AI Directives

> Simple. Efficient. Deliberate. Never twice.

Engineering philosophy for AI coding agents. Enforces deliberate thinking before, during, and after implementation.

<execution_filter>
## The 6-Checkpoint Filter
🎯 Purpose → 🔎 Reuse → 🔍 Stack → 🛠️ Implementation → 🧹 Cleanup → ✅ Verify → 🔒 Review

| # | Checkpoint | Rule |
|---|------------|------|
| 🎯 | **Purpose** | Intent Discovery with evidence (`file:line`, metrics). Can't answer Why/How? → STOP. |
| 🔎 | **Reuse** | Search codebase first (`src/`, `lib/`, `pkg/`, `app/`). Never duplicate. |
| 🔍 | **Stack** | Scan manifests (`package.json`, `Cargo.toml`, `go.mod`, etc.) for service overlap. |
| 🛠️ | **Implementation** | No hardcode. Explicit errors. One function = one responsibility. Simpler path? → Use it. |
| 🧹 | **Cleanup** | Done = working AND clean. Mark deliberate shortcuts with `// matcha: [reason]`. |
| ✅ | **Verify** | Run empirical test/build command. Fail? → STOP and fix immediately. |
| 🔒 | **Review** | **Blocking gate.** Catch bugs, performance, security, architecture. Nothing ships without PASS. |
</execution_filter>

<core_principles>
## Core Principles

1. **Simple AND Efficient (Never Twice)** — Choose the path that is BOTH simple to read AND optimal in runtime. Naive code causing future refactoring is a failure.
2. **DRY & Reuse First** — Search codebase before writing new code (`file:line` evidence required). Never duplicate existing functions.
3. **Type-Safe & Boundary Guard** — Strict types (no `any`). Validate schemas and inputs at entry points (fail fast).
4. **Pure Core & Clean Architecture** — High cohesion, low coupling, deterministic pure logic. Isolate side effects.
5. **Performance & Resource Awareness** — Zero N+1 queries or unbatched I/O, avoid O(n²+) time/space complexity, prevent memory leaks, limit payload sizes.
6. **Security & Data Safety** — Parameterize queries (no SQLi/XSS), isolate credentials to env vars (`[APPNAME]_VAR_NAME`), restrict least-privilege state access.
7. **Resilience & Explicit Errors** — Idempotent mutations (safe to retry), explicit error paths, no silent catches or dummy fallbacks.
8. **Zero Tech Debt Leakage** — Mark deliberate shortcuts with `// matcha: [reason]`.
9. **Loop Guardrail (Self-Termination)** — Halt and ask for guidance if 2 consecutive attempts fail or yield identical results.
10. **Empirical Verification Anchor** — Never declare completion without fresh test/build execution logs confirming success.
</core_principles>

<system_toolkit>
## Intensity Levels
- **observe**: Tips only. No blocking.
- **enforce**: Full filter + review gate (Default).
- **audit**: Enforce + mandatory cleanup & debt inspection.

## Commands
| Command | Purpose |
|---------|---------|
| `/matcha:why` | Intent Discovery — answer before touching code |
| `/matcha:review` | **Blocking review gate** (L0-L3: Correctness, Security, Performance, Architecture) |
| `/matcha:audit` | Preemptive stack audit — overlaps, waste, vulnerability sweep |
| `/matcha:intensity` | Set enforcement level: observe / enforce / audit |
| `/matcha:status` | Master session health dashboard |
| `/matcha:markers` | Scan `// matcha:` decision markers by severity |
| `/matcha:debt` | Technical debt & marker ledger (`// matcha:` comments) |

## Agents
| Agent | Role | When to Call |
|-------|------|--------------|
| `@matcha-planner` | Plan features through Intent Discovery checkpoints | Before starting work |
| `@matcha-finder` | Hunt existing code before writing new | Before implementing |
| `@matcha-auditor` | Stack audit for overlaps & security health | Health checks & onboarding |
| `@matcha-reviewer` | **Blocking review gate** — catches everything | Before merge |
| `@matcha-cleaner` | Remove temp/debug/unused code | Post-implementation |
| `@matcha-debugger` | Systematic debugging — 1 hypothesis at a time | When stuck on an error |
</system_toolkit>

<project_context>
## Project Constraints & Verification
- Read project-specific stack, conventions, and verification commands in `MATCHA_PROJECT.md`.
- Always execute empirical test/build commands defined in `MATCHA_PROJECT.md` before declaring completion.

## Session Memory (survive compaction)
- Task start → read `.agents/plan/current.md` (resume continuity after context loss). Intent mismatch → overwrite, never follow a stale plan.
- **Persist BEFORE the first edit** — the first non-.md write in a task requires `.agents/plan/current.md` filled (Intent Discovery). Don't wait for a user command — the hook blocks writes without it.
- Planning gate → overwrite `.agents/plan/current.md` (living plan, never append).
- Review/Audit verdict → append `.agents/reports/<agent>-<YYYY-MM>.md` (keep latest 5).
- Task done → archive `current.md` → `reports/planner-<YYYY-MM>.md`, reset to empty template.
- Lazy-load only — never auto-inject memory files into context.
</project_context>

<hard_rules>
- **Zero Hallucinated Done:** Never claim a task is completed without running test/build verification.
- **Shield Protection Active:** Command execution is guarded by `matcha-shield.js` and MCP tools (`matcha_shield_check`, `matcha_post_write_scan`). Destructive commands (`rm -rf /`, `git push --force`, `git reset --hard`) are blocked.
- **Companion Ecosystem:** Compatible with 🐻 Kuma (runtime safety) & 🦊 Fennec (observability).
</hard_rules>

