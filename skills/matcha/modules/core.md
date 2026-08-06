# 🍵 matcha — Core Rules

> Simple. Efficient. Deliberate. Never twice.

Always take the **easiest AND most efficient path** — not just one. Easy without efficiency = tech debt. Efficient without simplicity = over-engineering. Both, always.

---

## Context-Aware Modes

Agent auto-switches behavior based on what it's doing:

| Mode | Trigger | Planning Gate | Review Gate |
|------|---------|---------------|-------------|
| **🔍 Explore** | Reading, greping | ⏭️ Skip | ⏭️ Skip |
| **🛠️ Implement** | Writing new code | ✅ Enforce | ✅ Enforce |
| **🔄 Refactor** | Changing existing code | ✅ Enforce + legacy | ✅ Enforce |
| **🐛 Debug** | Error, investigating | ⏭️ Skip | ⏭️ Skip |
| **🔒 Review** | Finished implementing | ⏭️ Skip | ✅ IS the review |

See `modules/modes.md` for full mode switching rules.

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

**Smart Auto-Skip:** Planning gate is automatically skipped for:
- Read-only commands (grep, ls, cat, find, git status)
- Test commands (any test runner)
- Lint/format commands (any linter or formatter)
- Documentation files (.md, .txt, .rst)
- Test files (any test pattern)

**Enforced for:**
- New feature implementation
- Refactoring existing code
- Config changes
- DB migrations
- Any production code changes

```xml
<matcha_gate>
  <what>Describe what you are building/fixing — with file refs</what>
  <why>Why is this necessary? — with evidence (metrics, errors, user requests)</why>
  <how>What is the simplest and most efficient implementation path? — numbered steps</how>
</matcha_gate>
```

---

## 🎯 Checkpoint 1: Purpose + Reuse

**Intent Discovery** — Before planning, confirm Problem, Goals, Success Criteria, and What → Why → How with evidence. What/Why/How is one technique; the container also captures Assumptions and Unknowns. Can't answer Why/How with evidence? → STOP.

**Hunter Protocol** — Search codebase for existing logic before writing new code. Function exists? Utility handles it? → **Reuse. Don't rewrite.** Report exact `path:line`.

| Intensity | Behavior |
|-----------|----------|
| observe | Note if Why/How unclear or match found. User decides. |
| enforce | **STOP.** Ask user. Block if Why/How missing or exact match found. |
| audit | **STOP.** Must answer. Must reuse — only implement if no match exists. |

## 🔍 Checkpoint 2: Stack

Scan manifests (`package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `requirements.txt`, `.env.example`, `Makefile`) for service overlap. What you're adding — does anything existing already do this?

| Intensity | Behavior |
|-----------|----------|
| observe | Report overlaps as FYI. User decides. |
| enforce | **STOP on overlap.** Report. Wait for user. |
| audit | **STOP.** Must justify or remove. No workaround. |

## 🛠️ Checkpoint 3: Implementation

**Legacy Code Protocol:** If working on code >6 months old or >300 lines, activate legacy protocol:
- Batch size: 5-20 files per batch
- Impact analysis before each change
- Tests must pass after each batch
- Git checkpoint before starting
See `modules/legacy.md` for full protocol.

**Before writing** — scope confirmed? audit done? simplest structure identified?

**Principles:**
- No hardcoded values. Env vars: `APPNAME_VAR_NAME`
- One function = one responsibility. Pure functions first — isolate side effects at boundaries.
- Type-safe by default. No type escape hatches.
- Prefer stdlib over new dependency. 3 use cases minimum before abstracting.
- Fail fast — validate inputs at boundaries. Guard clauses early.
- Performance awareness — watch for N+1 queries, O(n²+) loops, re-render cycles.
- Idempotency — operations should be safe to retry.
- Error handling — no empty catches, explicit error paths, structured logging.

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
- Mark deliberate shortcuts with `// matcha: [reason]`

## ✅ Checkpoint 5: Verify (Feedback Harness)

Auto-detect test framework → run tests → typecheck → lint. Test fail → STOP and fix.

## 🔒 Checkpoint 6: Review Gate (Risk-Based)

**Nothing ships without review.** Review depth matches risk level.

### Risk Tiers

| Tier | Risk | Review Level |
|------|------|-------------|
| **L0** | Disposable | Output check only |
| **L1** | Low | Lint + typecheck |
| **L2** | Product Logic | **Full review (8 categories)** |
| **L3** | High Risk | **Expert review + threat model** |

Tier meaning is fixed. What *maps* to each tier is defined by the active **trigger pack** (see `hooks/matcha-trigger-packs.json`). No domain is assumed.

### Auto-Detection

matcha does **not** hardcode what counts as "high risk" — that varies by project. Detection uses:
1. **Trigger pack** — domain-specific signal rules (web-saas, ml-pipeline, infra-iac, etc.)
2. **Core signals** — pathPattern, keyword, changeType, explicitMarker
3. **Default** — L2 if no pack loaded (never under-review)

See `modules/risk.md` for full detection framework.

### Review by Tier

- **L0**: Runs? → PASS
- **L1**: Lint + typecheck clean? → PASS
- **L2**: 8-category review (correctness, performance, security, architecture, errors, quality, testing, maintainability)
- **L3**: All L2 + threat model + expert sign-off required

See `/matcha:review` for full checklist.

### Verdicts

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
- Persistence: agents persist plan/report files directly where permitted (`.agents/plan/current.md` for planner + reviewer, `.agents/reports/**` for planner/reviewer/auditor — provider-enforced `edit` rules) or hand output to the orchestrating agent.
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

## Implementation Decision Matrix

**Before writing, compare approaches.** Don't just pick the first solution.

### Approach Selection

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
| < 3 params | Object/struct | Readability |
| 4+ params | Object/struct | Prevents arg-order bugs |
| Optional behavior | Strategy pattern | Open/closed principle |
| One-off script | Top-level code | No abstraction needed |

### Efficiency Comparison

When two approaches are viable, compare:

| Factor | Weight | Check |
|--------|--------|-------|
| **Correctness** | 100% | Does it handle all edge cases? |
| **Readability** | 80% | Can a new dev understand in <30s? |
| **Performance** | 60% | O(n) vs O(n²)? Memory? |
| **Testability** | 50% | Can it be unit tested easily? |
| **Reversibility** | 40% | Easy to change later? |

**Rule:** Correctness always wins. After that, prioritize readability over performance unless profiling proves bottleneck.

---

## Anti-Pattern Detection

**Reject these immediately.** Don't just flag — fix or explain why not.

### Database / Queries
| Anti-Pattern | Fix |
|-------------|-----|
| Fetching all columns when few needed | Select specific columns |
| N+1 queries in loop | JOIN or batch query |
| Missing WHERE on mutations | Always add WHERE |
| String interpolation in queries | Parameterized queries |
| No index on filtered columns | Add index |
| Unbounded result set | Add LIMIT |

### Error Handling
| Anti-Pattern | Fix |
|-------------|-----|
| Empty catch block | At minimum, log the error |
| Swallowed exceptions | Re-throw or handle explicitly |
| Generic error messages | Include context (what, where, why) |
| Catch-all without specificity | Catch specific error types |

### Code Structure
| Anti-Pattern | Fix |
|-------------|-----|
| God function (>50 lines) | Split by responsibility |
| Deep nesting (>3 levels) | Extract early returns |
| Long parameter list (>4) | Use options object/struct |
| Commented-out code | Delete. Git has history |
| TODO without issue link | Create issue or remove |
| Dead code paths | Remove. Git remembers |

### Naming & Constants
| Anti-Pattern | Fix |
|-------------|-----|
| Hardcoded magic numbers | Extract to named constant |
| Unclear variable names | Use descriptive names |
| Abbreviations in names | Spell out (unless domain-standard) |
| Boolean traps (arg, true) | Use named options or enums |

---

## Debt Prevention

**Prevent debt, don't just flag it.** Make the right choice the first time.

| Debt Type | Prevention |
|-----------|------------|
| **Duplication** | Extract after 3rd copy, not after 10th |
| **Over-abstraction** | Inline if used <3 times |
| **Under-abstraction** | Extract if same pattern in 3+ places |
| **Magic numbers** | Name them: `MAX_RETRIES = 3` |
| **Dead code** | Delete now. Git remembers |
| **Missing types** | Add types at boundaries first |
| **Empty catches** | Log or re-throw. Never swallow |
| **Deep nesting** | Early returns. Guard clauses |
| **Long functions** | Split when >30 lines or >3 concerns |
| **Hardcoded config** | Move to env vars or config file |

---

## Smart Review Checklist

**When reviewing, ask these questions in order:**

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
