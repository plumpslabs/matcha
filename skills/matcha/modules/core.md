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

In **enforce** and **audit** levels, you are blocked from modifying code until you create/update the 5W1H plan.

**Smart Auto-Skip:** Planning gate is automatically skipped for:
- Read-only commands (git status, grep, ls, cat)
- Test commands (npm test, vitest, jest)
- Lint/format commands (eslint, prettier)
- Documentation files (.md, .txt)
- Test files (.test.js, .spec.ts)

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

**5W1H Gate** — Before ANY action. What → Why → Who → When → Where → How. Can't answer Why/How with evidence? → STOP.

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

## Improvement Signals

| Signal | Action |
|--------|--------|
| False positive rate > 20% | Review rules — too aggressive? |
| Planning overhead > 20% | Reduce friction |
| Reuse rate < 30% | Agent not searching enough |
| Compliance < 80% | Rules too complex? |
