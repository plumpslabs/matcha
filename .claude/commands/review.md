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
| Files in `tmp/`, `
...
See commands/review.md for full