# /matcha:review

**The gate between code and "done".** Nothing ships until this passes.

## Risk-Based Routing

Not all code needs the same review. Matcha auto-detects risk tier and routes accordingly:

| Tier | Risk | What | Review |
|------|------|------|--------|
| **L0** | Disposable | Spikes, scripts, temp | Output check only |
| **L1** | Low | Copy, fixtures, UI text | Lint + typecheck |
| **L2** | Product Logic | Features, API, business logic | **Full review (8 categories)** |
| **L3** | High Risk | Auth, payments, DB, crypto | **Expert review + threat model** |

## Auto-Detection

Risk tier is detected from:

| Signal | Tier |
|--------|------|
| Files in `auth/`, `payment/`, `crypto/`, `security/` | L3 |
| Keywords: password, token, secret, encrypt, jwt | L3 |
| DB changes: ALTER, DROP, schema | L3 |
| Payment: charge, refund, billing | L3 |
| New API endpoints, business logic | L2 |
| Test files, fixtures, mocks | L1 |
| Docs, comments, formatting | L1 |
| Files in `tmp/`, `temp/`, `debug/` | L0 |
| `// matcha:explain` with justification | L0 |

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

### L2 — Full Review (8 categories)

#### 🔴 Must Fix
1. **Correctness** — Logic changed intentionally? Edge cases? Off-by-one? Race conditions? Dead code?
2. **Performance** — O(n²+)? N+1 queries? Re-render loops? Memory leaks? Unbounded operations?
3. **Security** — Injection? Secrets? Auth bypass? Unvalidated input?

#### 🟡 Should Fix
4. **Architecture** — God object? Circular deps? Over-engineering?
5. **Errors** — Empty catches? Missing error paths? No retry?
6. **Quality** — Duplication? Magic numbers? Deep nesting?

#### 🟢 Nice to Have
7. **Testing** — New code tested? Edge cases covered?
8. **Maintainability** — WHY comments? Config via env vars?

**Verdict:** BLOCK / PASS_WITH_FIXES / PASS

### L3 — Expert Review + Threat Model

All L2 checks PLUS:
- [ ] Threat model documented
- [ ] Input validation at every boundary
- [ ] Auth checks enforced (authN + authZ)
- [ ] No secrets in code, logs, errors
- [ ] Parameterized queries only
- [ ] Rate limiting considered
- [ ] Audit trail for sensitive ops
- [ ] Rollback plan for DB changes
- [ ] **Security team sign-off required**

**Verdict:** EXPERT_REQUIRED (cannot auto-pass)

## Verdict Rules

| Tier | Auto-pass? | Verdict |
|------|-----------|---------|
| L0 | ✅ Yes | **PASS** if runs |
| L1 | ✅ Yes | **PASS** if lint + typecheck clean |
| L2 | ⚠️ Conditional | BLOCK / PASS_WITH_FIXES / PASS |
| L3 | ❌ Never | **EXPERT_REQUIRED** — domain expert must review |

## Report Format

```
🍵 matcha: review

Risk Tier: L2 (Product Logic) — auto-detected from [reason]

Scope: [files, lines +/-]

🔴 CRITICAL (must fix):
  file:line — [issue]
  → [fix]

🟡 WARNING (should fix):
  file:line — [issue]
  → [fix]

🟢 INFO:
  file:line — [suggestion]

📊 Critical: N | Warning: N | Info: N
Verdict: BLOCK / PASS_WITH_FIXES / PASS / EXPERT_REQUIRED
```

## Key Principle

> Review depth matches risk level.
> L0: does it run? L3: does it compromise the system?
> Don't over-review trivial code. Don't under-review critical code.
