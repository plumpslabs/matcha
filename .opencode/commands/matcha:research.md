---
description: "🍵 Deep-research — plan, fan out, cross-validate, synthesize cited report"
---
# /matcha:research

**Research with receipts.** Plan → fan out to scouts → cross-validate claims → cited synthesis.

## Depth Routing

| Depth | When | Scouts | Budget |
|-------|------|--------|--------|
| **simple** | Fact-finding, single aspect | 1 | ≤3 calls |
| **deep** | Comparison, multi-aspect | 3-5 | ≤5 calls each |

Bias to simple. Parallelize only for explicit comparisons or clearly independent aspects.

## Process

1. **Ledger first** — `matcha_research_lookup` before fan-out; fresh answer on file → zero scouts.
2. **Plan** — decompose into 3-7 sub-topics (or 1 for simple).
3. **Fan out** — one scout per aspect: objective + output format + boundaries.
4. **Cross-validate** — vote per claim; drop failures, disclose drops.
5. **Synthesize** — themed report + Sources section. Run `matcha_research_validate` before finalizing.
6. **Persist** — `persistTopic` on valid verdicts (ledger); sweep stale via `matcha_research_stale`.

## Budget Guard

Stop when you can answer confidently. Never search for perfection. Over budget → PARTIAL/INSUFFICIENT + state the gap.
