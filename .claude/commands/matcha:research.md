---
description: "🍵 Deep-research — plan, fan out, cross-validate, synthesize cited report"
---
# /matcha:research

**Research with receipts.** One prompt → researcher auto-runs the full loop (scope → scouts → critic → synthesis). No re-prompting between phases.

## Depth Routing

| Depth | When | Scouts | Budget |
|-------|------|--------|--------|
| **simple** | Fact-finding, single aspect | 1 | ≤3 calls |
| **deep** | Comparison, multi-aspect | Up to 8 (auto-spawned) | ≤5 calls each |

Bias to simple. Parallelize only for explicit comparisons or clearly independent aspects.

## Process

1. **Ledger first** — `matcha_research_lookup` before fan-out; fresh answer on file → zero scouts.
2. **Scope JSON** — decompose into 4+ complementary angles (`{question, summary, angles:[{label, query, rationale}]}`).
3. **Fan out** — one scout per angle (up to 8 scouts deep, 1 simple): objective + output format + boundaries.
4. **Critic pass (deep)** — `@matcha-critic` attacks findings (primary-vs
...
See commands/matcha:research.md for full