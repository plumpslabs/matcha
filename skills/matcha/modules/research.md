# 🍵 matcha — Deep Research

> Plan, fan out, cross-validate, synthesize. No claim without a source.

## When to Load

On demand — `/matcha:research` or any web/codebase multi-source question.

## Depth Routing

- **simple**: fact-finding, one aspect → researcher answers directly or 1 scout, ≤3 calls.
- **deep**: comparison or independent aspects → researcher auto-spawns up to 8 scouts itself (single prompt, no re-prompt round-trips), ≤5 calls each, 4+ fixed angles.
- Bias to simple. Stop at evidence saturation (wasted tail = failing trajectory).

## Single Entry

One user prompt → researcher runs the FULL loop itself (scope → scouts → critic → gap loop → synthesis → persist). Scouts/critic never need separate prompts; researcher holds task:allow solely to spawn them.

## Retrieval Routing (tiered, free-first)

- news/freshness → free tier (Brave, fastest + cheapest).
- code/docs semantic → Exa deep (needs `EXA_API_KEY`; best coding-docs completion).
- multi-aspect deep → Tavily advanced (needs `TAVILY_API_KEY`; citations).
- Default: free search + highlights extract, zero setup. PDF via text layer (≤4k, page refs).

## Scout Protocol

- Intent gate first: restate query + restrictions before fan-out.
- Broad queries first, then narrow. Dedupe queries — pivot angles, never paraphrase failures.
- Highlights-first excerpts (≤2k/source); raw dumps never touch the lead context.
- Round 1 returns URLs + one-line relevance (corpus building, no deep reads); lead dedupes, then assigns deep-reads.

## Synthesis Rules

- Ledger first: `matcha_research_lookup` before fan-out (reads index, then matched topic files only); fresh answer on file → zero scouts.
- Critic pass mandatory on deep: `@matcha-critic` attacks findings (no new research), tags confidence; one repair round max.
- Gap loop max 2: assess, at most one targeted follow-up, verdict stands.
- Every claim cites `[N]` → Sources section (URL or file:line, date for time-sensitive).
- Tier every source `[P]` primary / `[S]` secondhand / `[C]` anecdote; decision-grade claims need `[P]` or 2× independent `[S]`; `[C]`-only claims cap at LOW.
- Time-sensitive claims (pricing, model IDs, versions, limits) carry `as-of` dates; flag `STALE-RISK` if newest source >30 days old; live-probe (`GET /models`, changelog, status page) when feasible.
- Codebase facts verified by direct read — never trust prompt-provided file:line blindly.
- Adoption questions MUST include an Alternatives table (cost/quality/ops/migration) + conditional recommendation.
- Report sections Critic, Dropped, Gaps are mandatory on deep (empty with reason if none) — a report without them fails validation.
- High-stakes claims tagged `[HIGH-STAKES]` need 2+ independent sources.
- Failed claims are dropped **and disclosed** (`dropped:` note).
- Sources are deduplicated — the same URL twice is rejected.
- Scope JSON: emit `## Scope` as `{question, summary, angles:[{label, query, rationale}]}`. Minimal 4 angles for deep.
- Critic pass: `@matcha-critic` checks findings on deep runs (primary-vs-secondhand, contradictions, confidence tag `[High/Med/Low]`).
- Gap loop: max 2 rounds (assess coverage vs scope; at most 1 targeted follow-up round, then lock verdict).
- Plan section lists sub-topics; every sub-topic addressed in Findings.
- Counts line: `📊 Claims: N | Validated: N | Dropped: N` (Validated + Dropped = Claims).
- Verdict: COMPLETE / PARTIAL / INSUFFICIENT (PARTIAL and INSUFFICIENT disclose the gap).
- Run `matcha_research_validate` before finalizing; revisions re-validate fully.
- Persist via `persistTopic` on valid verdicts; sweep stale with `matcha_research_stale`.
