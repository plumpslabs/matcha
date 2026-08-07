# 🍵 matcha — Risk-Based Review Routing

> Not all code needs the same review. Route by risk.

This is the **core framework**. It is domain-agnostic by design — it defines *how* risk tiers work, not *what* counts as risky in your specific stack. Actual detection rules live in a separate **trigger pack** (see `matcha-trigger-packs.json`), which you swap or extend per project/domain.

---

## Risk Tiers

| Tier | Risk | Review Level |
|------|------|-------------|
| **L0** | Disposable | Output check only |
| **L1** | Low | Lint + typecheck |
| **L2** | Product Logic | **Full review** |
| **L3** | High Risk | **Expert review + threat model** |

Tier meaning is fixed. What *maps* to each tier is defined by whichever trigger pack is active for the project.

---

## How to Detect Risk Tier

matcha does **not** hardcode what "high risk" means — that varies by domain (a web SaaS's high risk is auth/payments; an ML pipeline's is data leakage/training integrity; infra's is destructive applies; embedded's is memory/hardware safety).

Detection works in two layers:

1. **Core signal types** (generic, always available):
   - `pathPattern` — glob/regex against changed file paths
   - `keyword` — string/regex match against diff content
   - `changeType` — structural signal (schema change, new public API, deleted file, permission change, dependency added)
   - `explicitMarker` — inline override, e.g. `// matcha:tier=L3 reason=...`

2. **Trigger pack** (domain-specific, swappable):
   A JSON file mapping tiers → lists of signals using the core signal types above. See `matcha-trigger-packs.json` for ready-made packs (`web-saas`, `ml-pipeline`, `infra-iac`, `mobile`, `embedded`, `cli-tool`) and instructions for writing your own.

**Resolution order:** explicit markers > highest matching tier from any triggered signal > default L2 for anything that touches logic but matches nothing > L1 for non-logic files > L0 only if explicitly in a disposable path.

**Proportionality override (diff-size heuristic):** a **trivial change (≤5 LOC, 1 file, no logic/branching change — typo, rename, copy, config value, docs)** auto-routes to **L0/L1** — output check or lint/typecheck, not the full 9-category review. **EXCEPTION: the override applies only when no trigger-pack signal matches.** If a pack signal fires (auth/payments/DB/security paths, schema changes, etc.), the pack tier wins — a 4-LOC change inside an auth or payment file is still L3. A small contained change (1-3 files) stays L2 but review depth is applied to the touched lines, not the whole codebase. Full review applies to large/cross-cutting/prod-risk changes. Never over-review a typo; never under-review auth/payments/DB.

**Default tier if no pack is loaded:** L2. matcha should never silently under-review just because no trigger pack matched — unmatched logic defaults to full review, not a free pass (but see the Proportionality override above for trivials).

---

## Review Checklist by Tier

### L0 — Output Check
- [ ] Does it run without errors?
- [ ] Is it in the intended disposable location/scope?

### L1 — Lint + Typecheck
- [ ] Lint passes
- [ ] Typecheck passes (if applicable to the language)
- [ ] No obvious issues on a quick read

### L2 — Full Review (9 categories)

**Every category must be addressed explicitly — PASS or FINDINGS with `file:line` evidence. No category may be silently skipped.** The `matcha_review_validate` MCP tool rejects a verdict missing tier, scope, per-finding evidence, category coverage, or consistent counts.

1. 🔴 Correctness — logic, edge cases, race conditions
2. 🔴 Performance — complexity, N+1-style repeated work, unbatched I/O, unbounded operations, memory/resource leaks
3. 🔴 Security — trust boundaries, authN/authZ + IDOR, output encoding, secrets, fail-closed
4. 🟡 Architecture — god objects, circular deps, coupling
5. 🟡 Errors, Logging & Validation — swallowed exceptions, missing paths, generic messages, secrets/PII in logs, missing boundary validation
6. 🟡 Resilience & Data — timeouts, retry with backoff, circuit breaker, transactions, migrations with rollback
7. 🟡 Quality — duplication, magic numbers, excessive nesting
8. 🟢 Testing — coverage, edge cases, isolation
9. 🟢 Maintainability — docs, naming, config

These 9 categories are intentionally domain-neutral. A trigger pack can *add* domain-specific checklist items (e.g. "threat model documented" for security-heavy domains) but should not need to replace the base 9.

### L3 — Expert Review + Threat Model
All L2 checks, plus whatever domain-specific high-risk checklist the active trigger pack defines (see each pack's `l3ChecklistAdditions`). No L3 review auto-passes — it always requires a domain expert to sign off, regardless of pack.

---

## Verdict by Tier

| Tier | Verdict Rules |
|------|--------------|
| L0 | **PASS** if it runs. No deep review needed. |
| L1 | **PASS** if lint + typecheck clean. |
| L2 | Standard verdict: `BLOCK` / `PASS_WITH_FIXES` / `PASS` |
| L3 | **EXPERT_REQUIRED** — must have domain expert review. No auto-pass. |

---

## Integration

When a review is triggered:

1. **Load the active trigger pack** for this project (or fall back to the L2 default if none is configured)
2. **Auto-detect tier** from changed files/content using the pack's signals
3. **Apply the appropriate checklist** — base 9 categories for L2, plus any pack-specific additions for L3
4. **Report tier and which pack/signal caused it** in the review output, for auditability
5. **L3 requires escalation** — cannot auto-pass regardless of pack

```
🍵 review: [files] — Risk: L2 (Product Logic) [pack: web-saas]
  🔴 CRITICAL: ...
  Verdict: BLOCK

🍵 review: [files] — Risk: L3 (High Risk) [pack: ml-pipeline, signal: keyword "training_data"]
  Verdict: EXPERT_REQUIRED

🍵 review: [files] — Risk: L0 (Disposable) [pack: web-saas]
  ✅ Runs without errors
  Verdict: PASS
```

---

## Writing a Custom Trigger Pack

A pack is a JSON object with this shape:

```json
{
  "packName": "your-domain",
  "description": "One line on what kind of project this is for",
  "l3Signals": [
    { "type": "pathPattern", "value": "regex or glob" },
    { "type": "keyword", "value": "regex" },
    { "type": "changeType", "value": "schema_change | new_public_api | deleted_file | permission_change | dependency_added" }
  ],
  "l2Signals": [ /* same shape */ ],
  "l1Signals": [ /* same shape */ ],
  "l0Signals": [ /* same shape */ ],
  "l3ChecklistAdditions": [
    "Domain-specific item 1",
    "Domain-specific item 2"
  ]
}
```

Multiple packs can be active at once (e.g. a web-saas project that also trains an internal ML model uses both `web-saas` and `ml-pipeline` packs); the highest tier any pack assigns wins.
