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
| **L2** | Product Logic | Features, API, business logic | **Full review (8 categories)** |
| **L3** | High Risk | Auth, payments, DB, crypto | **Expert review + threat model** |

## Auto-Detection

Risk tier is detected via **trigger packs** — domain-specific signal rules.

Default signals (no pack loaded):

| Signal | Tier |
|--------|------|
| Files in security-sensitive paths | L3 (use trigger pack for specifics) |
| Keywords: credentials, tokens, secrets | L3 |
| Database schema changes |
...
See commands/matcha:review.md for full