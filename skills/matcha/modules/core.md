# 🍵 matcha — Core Rules

> Simple. Efficient. Deliberate. Never twice.

Always take the **easiest AND most efficient path** — not just one. Easy without efficiency = tech debt. Efficient without simplicity = over-engineering. Both, always.

---

## ⚖️ Proportionality (effort ↔ risk)

The gates exist to protect — not to slow you down. **Match effort to risk.** Over-analysis is not rigor; it is waste. When in doubt between two adequate options → pick the simpler, note the alternative, move on. Rigor = right-sized evidence for the decision at hand.

**Task sizing (decide BEFORE planning):**

| Size | Shape | Ceremony |
|------|-------|----------|
| 🟢 **Trivial** | ≤5 LOC, 1 file, no logic change (typo, rename, copy, config value) | **2-line plan** (problem + done condition) in `current.md` to satisfy the gate, **NO full review.** Do it, run existing tests. Fast pass. |
| 🟡 **Small** | 1-3 files, contained logic | Plan = 5 lines max in `current.md`. Review = L1 (lint+typecheck). No deep audit. |
| 🔴 **Large** | >3 files, cross-cutting, prod/security risk, DB, auth | Full gate: intent, plan, risk review. |

**Speed rules:**
- Planning takes longer than the implementation would → you are over-planning. Stop, shrink the plan.
- Standards are a checklist for **risk** — check what the change touches, not every rule.
- **Exit conditions beat STOP.** Before STOP ask: *is this actually blocking, or can I proceed on a recorded assumption?* Prefer proceeding with a visible assumption over stopping the user for trivia. **Record assumptions in the plan's Assumptions field** so they survive context compaction.
- Never block on things you can't verify cheaply — state uncertainty, proceed, flag for review.

---

## Context-Aware Modes

Agent auto-switches behavior based on what it's doing (full rules in `modules/modes.md`):

| Mode | Trigger | Planning Gate | Review Gate |
|------|---------|---------------|-------------|
| **🔍 Explore** | Reading, greping | ⏭️ Skip | ⏭️ Skip |
| **🛠️ Implement** | Writing new code | ✅ Enforce | ✅ Enforce |
| **🔄 Refactor** | Changing existing code | ✅ Enforce + legacy | ✅ Enforce + regression check |
| **🐛 Debug** | Error, investigating | ⏭️ Skip | ⏭️ Skip |
| **🔒 Review** | Finished implementing | ⏭️ Skip | ✅ IS the review |

---

## Intensity Levels

| Level | Behavior |
|-------|----------|
| **observe** | Note issues, let user decide. No blocking, no planning gate. |
| **enforce** | Report + wait for user. Block on critical. Hard planning gate. **Default.** |
| **audit** | Mandatory fix. No exceptions. All issues flagged. Hard planning gate. |

Set with `/matcha observe|enforce|audit`. Default: **enforce**.

### 🔴 PLANNING GATE (ENFORCED BY HOOK)

In **enforce** and **audit** levels, you are blocked from modifying code until you create/update the Intent Discovery plan at `.agents/plan/current.md` (Problem, Goals, Success Criteria, What → Why → How). **Persist it BEFORE the first code edit — never wait for a user command.** The hook (matcha-shield / opencode plugin) reads `.agents/plan/current.md` and blocks code writes while the plan is missing or still TBD.

**Auto-skip (hook, benchmark-backed).** The gate is skipped for:
- Read-only commands (grep, ls, cat, find, git status), test runners, linters/formatters
- Documentation files (.md, .txt, .rst) and test files (any test pattern)
- **Small source edits ≤30 lines** on a non-manifest file (guard clause, rename, config value, small bug fix) — do NOT write a plan; the hook lets them through immediately (measured fix for the +33% token / +70% time overhead on small edits)
- **Trivial tasks** — a minimal plan carrying the `<!-- trivial -->` marker (or `type: plan-trivial` in frontmatter) plus a `**Problem:**` line satisfies the gate. Without the marker, Problem + Goals + Success Criteria are required.

**Enforced for:** new feature implementation, refactoring existing code, config changes, DB migrations, any production code changes.

```xml
<matcha_gate>
  <what>Describe what you are building/fixing — with file refs</what>
  <why>Why is this necessary? — with evidence (metrics, errors, user requests)</why>
  <how>What is the simplest and most efficient implementation path? — numbered steps</how>
</matcha_gate>
```

---

## 🎯 Checkpoint 1: Purpose + Reuse

**Intent Discovery** — Before planning, confirm Problem, Goals, Success Criteria, and What → Why → How with evidence. Can't answer Why/How with evidence? → STOP unless trivial (≤5 LOC, 1 file, no logic) — then proceed on a recorded assumption (see ⚖️ Proportionality).

**Hunter Protocol** — Search codebase for existing logic before writing new code. Function exists? Utility handles it? → **Reuse. Don't rewrite.** Report exact `path:line`.

**Intensity behavior** (levels in table above): **observe** = note, user decides · **enforce** = STOP, block if Why/How missing or exact match found · **audit** = STOP, must answer + reuse — implement only if no match exists.

## 🔍 Checkpoint 2: Stack

Scan manifests (`package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `requirements.txt`, `.env.example`, `Makefile`) for service overlap. What you're adding — does anything existing already do this?

**Intensity behavior:** **observe** = report overlaps as FYI · **enforce** = STOP on overlap, wait for user · **audit** = STOP, justify or remove, no workaround.

## 🛠️ Checkpoint 3: Implementation

**Legacy Code Protocol:** If working on code >6 months old or >300 lines, activate legacy protocol (full rules in `modules/legacy.md`): batch 5-20 files, impact analysis before each change, tests must pass after each batch, git checkpoint before starting.

**Before writing** — scope confirmed? audit done? simplest structure identified?

**Principles:**
- No hardcoded values. Env vars: `APPNAME_VAR_NAME`
- **Decision comments get marked at write time, not cleanup** — a comment explaining a *deliberate choice* (skipped validation, workaround, intentional hardcode, known debt, architecture decision) is prefixed while writing: `// matcha:explain <reason>` / `// matcha:debt <reason>, <fix when>` / `// matcha:adr <decision> (rationale: <why>)` — English only. Plain "what this does" comments need no marker.
- One function = one responsibility. Pure functions first — isolate side effects at boundaries.
- Type-safe by default. No type escape hatches.
- Prefer stdlib over new dependency. 3 use cases minimum before abstracting.
- Fail fast — validate inputs at boundaries. Guard clauses early.
- Performance awareness — watch for N+1 queries, O(n²+) loops, re-render cycles.
- Idempotency — operations should be safe to retry.
- Error handling — no empty catches, explicit error paths, structured logging.

**Universal engineering bar** — errors, logging, validation, API contracts, state, concurrency: see `modules/engineering.md` (loaded during implement + review).

**After writing** — pause and ask: *"Is there a simpler or more efficient path?"* Can any code be removed? Any logic duplicated? Would a different structure simplify this?

**Mid-task check:** Found a better path? → STOP with `matcha pause`:

```xml
⚠️ matcha pause
Current: [what you're doing]
Issue: [why it's suboptimal]
Alternative: [what you found]
```

## 🧹 Checkpoint 4: Cleanup

**"Done" = working AND clean.** Not just working.
- Remove temp files, debug code, unused imports
- Split files >300 lines or handling >3 concerns
- Verify no duplicated logic introduced
- Mark deliberate shortcuts with `// matcha: [reason]` — **standard format + English only**: `// matcha:explain <reason>`, `// matcha:todo <task>`, `// matcha:debt <reason>, <fix when>`, `// matcha:adr <ref>`. The post-write hook + reviewer flag non-English markers.

## ✅ Checkpoint 5: Verify (Feedback Harness)

Auto-detect test framework → run tests → typecheck → lint. Test fail → STOP and fix.

## 🔒 Checkpoint 6: Review Gate (Risk-Based)

**Nothing ships without review.** Review depth matches risk level.

### Risk Tiers

| Tier | Risk | Review Level |
|------|------|-------------|
| **L0** | Disposable | Output check only |
| **L1** | Low | Lint + typecheck |
| **L2** | Product Logic | **Full review (9 categories)** |
| **L3** | High Risk | **Expert review + threat model** |

Tier meaning is fixed. What *maps* to each tier is defined by the active **trigger pack** (see `hooks/matcha-trigger-packs.json`) — matcha does not hardcode "high risk". Detection: 1) trigger pack (domain-specific signals), 2) core signals (pathPattern, keyword, changeType, explicitMarker), 3) default L2 if no pack loaded (never under-review). Full framework: `modules/risk.md`.

**Review by Tier:**
- **L0**: Runs? → PASS
- **L1**: Lint + typecheck clean? → PASS
- **L2**: **9-category review** (correctness, performance, security, architecture, errors+logging+validation, resilience+data, quality, testing, maintainability). Every category addressed explicitly — PASS or FINDINGS with `file:line` evidence. No silent category skips.
- **L3**: All L2 + threat model + expert sign-off required

See `/matcha:review` for the full checklist. Verify the verdict with `matcha_review_validate` (rejects missing tier/scope/evidence/counts) before finalizing.

**Verdicts:**

| Verdict | Meaning |
|---------|---------|
| **PASS** | ✅ Clean. Ready to ship. (L0/L1 auto-pass if clean) |
| **PASS_WITH_FIXES** | 🟡 Warnings found. Fix or justify. (L2) |
| **BLOCK** | 🔴 Critical issues found. Must fix. (L2/L3) |
| **EXPERT_REQUIRED** | 🛑 Domain expert must review. Cannot auto-pass. (L3) |

---

## 🧠 Session Memory (Filesystem = durable memory)

The context window is volatile; the filesystem is not. Persist gate artifacts so a compacted or fresh session resumes in <500 tokens.

| File | Write | Read |
|------|-------|------|
| `.agents/plan/current.md` | Planning gate → **overwrite** (living plan, never append) | Start of every task |
| `.agents/reports/<agent>-<YYYY-MM>.md` | Review/Audit output → **append** | Resuming or auditing history |
| `.agents/plan/decisions.log` | `matcha decision <type> <reason>` | `matcha markers` / `/matcha:debt` |

Rules:
- **Lazy-load.** Never auto-inject memory files into context — read on demand.
- **`current.md` lifecycle (anti-stale) — always holds ONE active task:**
  1. **Start:** read it. Intent matches the current request? → continue, update in place. Mismatch → **overwrite** (never follow a stale plan).
  2. **Update:** overwrite / check-off in place. Never append (appending = bloat when re-read).
  3. **Done (task ships = review PASS):** the reviewer finalizes the handoff — appends the completed plan → `reports/planner-<YYYY-MM>.md`, writes its verdict → `reports/reviewer-<YYYY-MM>.md`, then **reset** `current.md` to the empty template (`status: active`, TBD). Only a PASS resets; BLOCK / PASS_WITH_FIXES keeps `current.md` for fix iteration. If no reviewer is used, the planner performs the same handoff.
- **Step execution (plan → implement handoff):** implement STRICTLY step-by-step from `current.md`'s Plan list — one step at a time, in order. Never jump ahead, never batch-finish steps. After EACH completed step: check it off (`[ ]` → `[x]`) and update the `**▶ Current:**` line (Step N/M, K done). The plan must always reflect the real position — that's the anti-stale mechanism that lets a compacted or fresh session resume mid-task in <500 tokens. Deviation from the plan (different approach, added scope, different files) → update the plan FIRST; significant deviations need user approval before proceeding. Never rewrite the step list mid-task without syncing `**▶ Current:**` to match.
- **Living over archive.** Reports append monthly, keep latest 5 per agent, delete older.
- **Format:** YAML frontmatter (`title`, `date`, `type`, `agent`, `status`, `tags`) — grep-able, git-friendly, standard.
- **Persistence:** agents persist plan/report files directly where permitted (`.agents/plan/current.md` for planner + reviewer, `.agents/reports/**` for planner/reviewer/auditor — provider-enforced `edit` rules) or hand output to the orchestrating agent.
- **Gate artifacts only.** Persist plan/review/audit outputs — they gate shipping. Skip work artifacts (finder/cleaner/debugger): cheaper to re-run than to archive.

---

## Execution Modes

### TDD Mode
For safety-critical code (auth, payments, data integrity):
```
RED → GREEN → REFACTOR → VERIFY
```
1. Write failing test first
2. Write minimum code to pass
3. Refactor while green
4. Run full suite

### Loop Mode
For tasks >3 steps or touching multiple files:
```
Goal → Act → Observe → Verify → Done? | Retry → Max? → Escalate
```
- Max 5 iterations before escalation
- Each iteration must show progress
- Same error twice → escalate immediately

### Batch Sizing

| Codebase | Batch | Review |
|----------|-------|--------|
| < 1k LOC | 1 batch | End only |
| 1k-10k | 5-10 files | Per batch |
| 10k-100k | 10-20 files | Per batch + final |
| > 100k | 5-10 files | Mandatory |

---

## Issue Format

```
🍵 matcha: [TITLE]

Observation: [what]
Why it matters: [impact]
Options: A) [trade-off] B) [trade-off]
Recommendation: [which and why]
```

## End-of-Task

```
🍵 matcha says:

🍵 [short roast]
→ [actionable suggestion]
```

**Critical — flag immediately:** swallowed errors, N+1, hardcoded secrets, race conditions, god objects.
**Minor — only if found:** TODO/FIXME, debug logs, unnecessary abstraction.

---

## Implementation Decision Matrix

**Before writing, compare approaches.** Don't just pick the first solution.

| Situation | Choose | Why |
|-----------|--------|-----|
| 1-2 uses | Inline it | Abstraction overhead not justified |
| 3+ uses | Extract function | DRY principle kicks in |
| < 300 LOC | Keep in one file | Splitting adds navigation cost |
| > 300 LOC or >3 concerns | Split | Cognitive load too high |
| Read-heavy data | Cache + invalidate | Recalculation waste |
| Write-heavy data | Compute on write | Read latency critical |
| Simple data transform | Declarative pipeline | Clear intent, testable |
| Complex logic with side effects | Imperative loop | Explicit control, debuggable |
| 4+ params | Object/struct | Prevents arg-order bugs |
| Optional behavior | Strategy pattern | Open/closed principle |
| One-off script | Top-level code | No abstraction needed |

**Efficiency comparison** when two approaches are viable — **Correctness (100%)** edge cases · **Readability (80%)** new dev in <30s · **Performance (60%)** O(n) vs O(n²), memory · **Testability (50%)** unit-testable · **Reversibility (40%)** easy to change. Correctness always wins; then readability over performance unless profiling proves a bottleneck.

---

## Anti-Pattern Detection

**Reject these immediately.** Don't just flag — fix or explain why not.

| Area | Anti-Pattern → Fix |
|------|--------------------|
| DB | Fetch-all-columns → select few · N+1 → JOIN/batch · missing WHERE → always add · string interpolation → parameterized · no index → add · unbounded → LIMIT |
| Errors | empty catch → log · swallowed → rethrow/handle · generic message → context · catch-all → specific types |
| Code | god function (>50 lines) → split · deep nesting (>3) → early returns · long params (>4) → object · commented-out → delete · TODO w/o issue → create/remove · dead code → remove |
| Naming | magic numbers → named constant · unclear names → descriptive · abbreviations → spell out · boolean trap → named options |
| Debt | duplication (3rd copy) → extract · over-abstraction (<3 uses) → inline · missing types at boundaries → add · empty catches → log/rethrow · long functions → split · hardcoded config → env vars |

---

## Smart Review Checklist

1. **Does it work?** — Run it. Test it. Edge cases.
2. **Is it the simplest path?** — Can any code be removed?
3. **Is it the most efficient path?** — O(n²) when O(n) exists?
4. **Will it age well?** — Easy to modify in 6 months?
5. **Is it safe?** — Secrets, injection, auth bypass?
6. **Is it clean?** — No debt introduced?

**If any answer is NO → fix before shipping.**

---

## Improvement Signals

| Signal | Action |
|--------|--------|
| False positive rate > 20% | Review rules — too aggressive? |
| Planning overhead > 20% | Reduce friction |
| Reuse rate < 30% | Agent not searching enough |
| Compliance < 80% | Rules too complex? |
