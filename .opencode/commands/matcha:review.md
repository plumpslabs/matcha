---
description: "🍵 Review gate — risk-based code review (L0-L3). Nothing ships until this passes"
---
# /matcha:review

**The gate between code and "done".** Nothing ships until this passes.

## Risk-Based Routing

Not all code needs the same review. Matcha auto-detects risk tier and routes accordingly:

| Tier | Risk | What | Review |
|------|------|------|--------|
| **L0** | Disposable | Spikes, scripts, temp | Output check only |
| **L1** | Low | Copy, fixtures, UI text | Lint + typecheck |
| **L2** | Product Logic | Features, API, business logic | **Full review (9 categories)** |
| **L3** | High Risk | Auth, payments, DB, crypto | **Expert review + threat model** |

## Auto-Detection

Risk tier is detected via **trigger packs** — domain-specific signal rules.

Default signals (no pack loaded):

| Signal | Tier |
|--------|------|
| Files in security-sensitive paths | L3 (use trigger pack for specifics) |
| Keywords: credentials, tokens, secrets | L3 |
| Database schema changes | L3 |
| New public API endpoints | L2 |
| Test files, fixtures, mocks | L1 |
| Documentation, comments | L1 |
| Files in disposable paths | L0 |
| `// matcha:explain` with justification | L0 |

Diff-size heuristic: tiny diffs (≤10 lines) stay low; large diffs (>100 lines or many files) escalate a tier.

## Review Checklists by Tier

### L0 — Output Check
- Does it run without errors?
- In the right temp directory?
- **Verdict: PASS** if runs.

### L1 — Lint + Typecheck
- Lint passes
- Typecheck passes
- No obvious issues
- **Verdict: PASS** if clean.

### L2 — Full Review (9 categories)

**Every category must be addressed explicitly — PASS or FINDINGS with `file:line` evidence. No category may be silently skipped.** Run `matcha_review_validate` on the final verdict (rejects missing tier/scope/evidence/counts).

#### 🔴 Must Fix
1. **Correctness** — Logic changed intentionally? Edge cases? Off-by-one? Race conditions? Dead code?
2. **Performance** — O(n²+)? N+1 queries? Unbatched I/O? Unbounded operations? Memory leaks?
3. **Security** — Trust boundaries? AuthN/AuthZ + IDOR? Output encoding? Secrets in code/logs/responses? Fail-closed?

#### 🟡 Should Fix
4. **Architecture** — God object? Circular deps? Over-engineering?
5. **Errors, Logging & Validation** — Empty catches? Generic messages? Secrets/PII in logs? Missing boundary validation?
6. **Resilience & Data** — Missing timeouts? Retry without backoff on non-idempotent ops? No circuit breaker? Transactions? Migrations with rollback?
7. **Quality** — Duplication? Magic numbers? Deep nesting?

#### 🟢 Nice to Have
8. **Testing** — New code tested? Behavior-not-implementation? Edge cases covered?
9. **Maintainability** — WHY comments? Config via env vars?

**Verdict:** BLOCK / PASS_WITH_FIXES / PASS

### L3 — Expert Review + Threat Model

All L2 checks PLUS:
- [ ] Threat model documented
- [ ] Input validation at every boundary
- [ ] Access control checks enforced
- [ ] No secrets in code, logs, errors
- [ ] Data access is safe and bounded
- [ ] Audit trail for sensitive operations
- [ ] Rollback plan for destructive changes
- [ ] **Domain expert sign-off required**

**Verdict:** EXPERT_REQUIRED (cannot auto-pass)

## Severity

- **CRITICAL** — production outage, security breach, data loss, incorrect business logic
- **HIGH** — major performance/reliability degradation, auth/payment/DB risk
- **MEDIUM** — maintainability, complexity, debt
- **LOW** — minor improvements (label `Nit:` — non-blocking)

## Verdict Rules

| Tier | Auto-pass? | Verdict |
|------|-----------|---------|
| L0 | ✅ Yes | **PASS** if runs |
| L1 | ✅ Yes | **PASS** if lint + typecheck clean |
| L2 | ⚠️ Conditional | BLOCK / PASS_WITH_FIXES / PASS |
| L3 | ❌ Never | **EXPERT_REQUIRED** — domain expert must review |

Findings found at L2 never auto-upgrade to L3 — escalation always requires expert sign-off.

## Lifecycle Handoff

**Task ships on PASS.** On verdict **PASS** (or PASS after PASS_WITH_FIXES fixes), the review closes the task lifecycle:
1. Append the completed plan from `.agents/plan/current.md` → `.agents/reports/planner-<YYYY-MM>.md`
2. Persist the verdict → `.agents/reports/reviewer-<YYYY-MM>.md`
3. **Reset** `current.md` to the empty template (`status: active`, TBD)

BLOCK / PASS_WITH_FIXES → keep `current.md` intact; the fix iteration continues from the same plan.

## Report Format

```
🍵 matcha: review

Risk Tier: L2 (Product Logic) — auto-detected from [reason]

Scope: [files, lines +/-]

## Category Checklist (all 9 required)
- [ ] Correctness — PASS / FINDINGS: [file:line]
- [ ] Performance — PASS / FINDINGS: [file:line]
- [ ] Security — PASS / FINDINGS: [file:line]
- [ ] Architecture — PASS / FINDINGS: [file:line]
- [ ] Errors, Logging & Validation — PASS / FINDINGS: [file:line]
- [ ] Resilience & Data — PASS / FINDINGS: [file:line]
- [ ] Quality — PASS / FINDINGS: [file:line]
- [ ] Testing — PASS / FINDINGS: [file:line]
- [ ] Maintainability — PASS / FINDINGS: [file:line]

CRITICAL (must fix):
  🔴 file:line — [issue] → [fix]

WARNING (should fix):
  🟡 file:line — [issue] → [fix]

INFO:
  🟢 file:line — [suggestion]  (label style-only notes `Nit:` — non-blocking)

📊 Critical: N | Warning: N | Info: N
Verdict: BLOCK / PASS_WITH_FIXES / PASS / EXPERT_REQUIRED
```

## Key Principle

> Review depth matches risk level.
> L0: does it run? L3: does it compromise the system?
> Don't over-review trivial code. Don't under-review critical code.
