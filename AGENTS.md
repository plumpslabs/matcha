# 🍵 matcha — Core AI Directives

> Simple. Efficient. Deliberate. Never twice.

Engineering philosophy for AI coding agents. Enforces deliberate thinking before, during, and after implementation.

<execution_filter>
## The 6-Checkpoint Filter
🎯 Purpose → 🔎 Reuse → 🔍 Stack → 🛠️ Implementation → 🧹 Cleanup → ✅ Verify → 🔒 Review

| # | Checkpoint | Rule |
|---|------------|------|
| 🎯 | **Purpose + Reuse** | Intent Discovery with evidence (`file:line`, metrics). Can't answer Why/How? → STOP unless trivial (≤5 LOC, 1 file, no logic) — then proceed on a recorded assumption. Search codebase first (`src/`, `lib/`, `pkg/`, `app/`). Never duplicate. |
| 🔍 | **Stack** | Scan manifests (`package.json`, `Cargo.toml`, `go.mod`, etc.) for service overlap. |
| 🛠️ | **Implementation** | No hardcode. Explicit errors. One function = one responsibility. Simpler path? → Use it. Deliberate-choice comments → `// matcha:` marker at write time (not cleanup). |
| 🧹 | **Cleanup** | Done = working AND clean. Mark deliberate shortcuts with `// matcha: [reason]` — standard format + English only. |
| ✅ | **Verify** | Run empirical test/build command. Fail? → STOP and fix immediately. |
| 🔒 | **Review** | **Blocking gate.** Catch bugs, performance, security, architecture. Nothing ships without PASS. |
</execution_filter>

<core_principles>
## Core Principles

0. **Proportionality (effort ↔ risk)** — Match ceremony to task size: trivial (≤5 LOC, 1 file, no logic) → no plan, fast pass; small (1-3 files) → short plan + lint review; large (cross-cutting/prod risk) → full gate. Planning > implementation = over-planning. Exit conditions beat STOP: proceed on a recorded assumption rather than blocking on trivia.
1. **Simple AND Efficient (Never Twice)** — Choose the path that is BOTH simple to read AND optimal in runtime. Naive code causing future refactoring is a failure.
2. **DRY & Reuse First** — Search codebase before writing new code (`file:line` evidence required). Never duplicate existing functions.
3. **Type-Safe & Boundary Guard** — Strict types (no `any`). Validate schemas and inputs at entry points (fail fast).
4. **Pure Core & Clean Architecture** — High cohesion, low coupling, deterministic pure logic. Isolate side effects.
5. **Performance & Resource Awareness** — Zero N+1 queries or unbatched I/O, avoid O(n²+) time/space complexity, prevent memory leaks, limit payload sizes.
6. **Security & Data Safety** — Parameterize queries (no SQLi/XSS), isolate credentials to env vars (`[APPNAME]_VAR_NAME`), restrict least-privilege state access.
7. **Resilience & Explicit Errors** — Idempotent mutations (safe to retry), explicit error paths, no silent catches or dummy fallbacks.
8. **Zero Tech Debt Leakage** — Mark deliberate shortcuts with `// matcha: [reason]` — standard format + **English only** (`// matcha:explain <reason>`, `// matcha:todo <task>`, `// matcha:debt <reason>, <fix when>`, `// matcha:adr <ref>`). **Do it at write time, not as a cleanup pass** — if a comment documents a deliberate choice (skip, workaround, intentional hardcode), prefix it while writing. Plain "what this does" comments need no marker.
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

> 🔒 **Enforced permissions (OpenCode `permission:` + Claude Code `disallowedTools:`):** `planner`, `finder`, `reviewer`, `auditor` are read-only — `edit` is denied for all source code (writable paths only: `.agents/plan/current.md` for planner + reviewer, `.agents/reports/**` for planner/reviewer/auditor). `debugger` + `cleaner` may modify code (minimal fix / post-confirmation cleanup). Bash is denied for planner/finder, allowed for the rest. Other providers (agy, Cursor, Windsurf) read the same agents — enforcement there is prompt-level + safety hooks.
</system_toolkit>

<industrial_scaling>
## Industrial & Large-Scale Codebase Protocols (Language & Agent Agnostic)

0. **⚡ Parallel Discovery Protocol (@matcha-planner & @matcha-finder)**
   - When a task or bug is ingested, run **Intent Discovery** (Planner) and **Symbol Graph Search** (Finder) concurrently.
   - Synchronize findings into `.agents/plan/current.md` before the first code write, reducing pre-implementation latency by up to 50%.

1. **🔎 Symbol-First Reuse Engine (@matcha-finder)**
   - Prioritize Language Server Protocol (LSP) and AST symbol indexing over flat text grep:
     - **TypeScript/JS**: `tsserver`, `oxc`, Biome, Tree-sitter.
     - **Python**: `pyright`, `jedi`, `ruff`, AST parser.
     - **Go**: `gopls`, `go doc`, `go list`.
     - **Rust**: `rust-analyzer`, `cargo check`.
     - **Java/Kotlin/C/C++**: `jdtls`, `clangd`, `ctags`.
     - **Agnostic Fallback**: Universal Ctags (`ctags -R`), Tree-sitter CLI, Ripgrep Symbol regex.
   - Enforce the 5-tier classification with exact `file:line` proof: **REUSE** | **EXTEND** | **COMPOSE** | **REFERENCE** | **NEW**.

2. **🧪 Smart Test Scoping (Affected Tests Only)**
   - During active development/debugging, run **only affected/targeted tests** instead of the entire test suite:
     - **JS/TS**: `vitest related --run <file>`, `jest --findRelatedTests <file>`, `turbo/nx affected -t test`.
     - **Python**: `pytest --picked`, `pytest tests/test_<file>.py`.
     - **Go**: `go test -v ./pkg/affected/...`.
     - **Rust**: `cargo test -p <affected_crate>`.
     - **Universal Fallback**: Detect paired test files via `git diff --name-only HEAD`.
   - Delegate full regression test suites to background CI pipelines.

3. **🚦 Adaptive Intensity Routing (Automated Blast-Radius Gate)**
   - **🟢 Auto-observe (Low Risk)**: Markdown (`*.md`), documentation, styling/CSS, static assets, comments. (No blocking gate, light lint check).
   - **🟡 Auto-enforce (Standard Logic - Default)**: Application source (`src/`, `lib/`, `pkg/`, `app/`), API handlers, UI logic, unit tests. (Full 6-checkpoint filter + DRY evidence + affected test green).
   - **🔴 Auto-audit (High Blast Radius)**: Authentication (`auth/`, `*jwt*`), security boundaries, payment/billing, database migrations (`migrations/`, `schema.prisma`, `*.sql`), cryptography, core middleware. (Mandatory threat model + stack overlap scan + L3 review gate).

4. **📦 Clean Change Hygiene & Conventional Commits**
   - Use standard format: `<type>(<scope>): <summary>` (English only, imperative, max 72 chars).
   - Zero agent drama in git log (e.g., replace internal prompt notes with professional technical rationale).
   - Clean author hygiene: zero AI agent co-author tags in commit messages.
</industrial_scaling>


<project_context>
## Project Constraints & Verification
- Read project-specific stack, conventions, and verification commands in `MATCHA_PROJECT.md`.
- Always execute empirical test/build commands defined in `MATCHA_PROJECT.md` before declaring completion.

## Session Memory (survive compaction)
- Task start → read `.agents/plan/current.md` (resume continuity after context loss). Intent mismatch → overwrite, never follow a stale plan.
- **Persist BEFORE the first edit** — the first non-.md write in a task requires `.agents/plan/current.md` filled (Intent Discovery). Don't wait for a user command — the hook blocks writes without it.
- Planning gate → overwrite `.agents/plan/current.md` (living plan, never append).
- **Step execution:** implement strictly step-by-step from `current.md`'s Plan list; after each step check it off (`[x]`) and update the `**▶ Current:**` line (Step N/M, K done). Never batch-finish without updating; deviation → update the plan first.
- Review/Audit verdict → append `.agents/reports/<agent>-<YYYY-MM>.md` (keep latest 5).
- Task done (review PASS) → reviewer archives `current.md` → `reports/planner-<YYYY-MM>.md`, writes verdict → `reports/reviewer-<YYYY-MM>.md`, resets to empty template. Only PASS resets — BLOCK / PASS_WITH_FIXES keeps the plan for fix iteration.
- Lazy-load only — never auto-inject memory files into context.
</project_context>

<hard_rules>
- **Zero Hallucinated Done:** Never claim a task is completed without running test/build verification.
- **Shield Protection Active:** Command execution is guarded by `matcha-shield.js` and MCP tools (`matcha_shield_check`, `matcha_post_write_scan`). Destructive commands (`rm -rf /`, `git push --force`, `git reset --hard`) are blocked.
- **Companion Ecosystem:** Compatible with 🐻 Kuma (runtime safety & context) & 🦊 Fennec (observability). If Kuma MCP is available: task start → `kuma_context({action: "init"})`, before editing unfamiliar area → `kuma_context({action: "research"})`, important bug/decision → `kuma_memory({action: "gotcha"|"decision"})`, post-edit verification → `kuma_safety({action: "verify"})`. If Kuma MCP is unavailable, proceed normally without blocking.
</hard_rules>

