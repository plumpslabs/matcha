# 🍵 matcha — Deep Research

> Plan, fan out, cross-validate, synthesize. No claim without a source.

## When to Load

On demand — `/matcha:research` or any web/codebase multi-source question.

## Depth Routing

- **simple**: fact-finding, one aspect → 1 scout, ≤3 calls.
- **deep**: comparison or independent aspects → 3-5 scouts, ≤5 calls each.
- Bias to simple. Stop at evidence saturation (wasted tail = failing trajectory).

## Retrieval Routing (tiered, free-first)

- news/freshness → free tier (Brave, fastest + cheapest).
- code/docs semantic → Exa deep (needs `EXA_API_KEY`; best coding-docs completion).
- multi-aspect deep → Tavily advanced (needs `TAVILY_API_KEY`; citations).
- Default: free search + highlights extract, zero setup. PDF via text layer (≤4k, page refs).

## Scout Protocol

- Intent gate first: restate query + restrictions before fan-out.
- Broad queries first, then narrow. Dedupe queries — pivot angles, never paraphrase failures.
- Highlights-first excerpts (≤2k/source); raw dumps never touch the lead context.

## Synthesis Rules

- Ledger first: `matcha_research_lookup` before fan-out (reads index, then matched topic files only); fresh answer on file → zero scouts.
- Every claim cites `[N]` → Sources section (URL or file:line, date for time-sensitive).
- High-stakes claims tagged `[HIGH-STAKES]` need 2+ independent sources.
- Failed claims are dropped **and disclosed** (`dropped:` note).
- Sources are deduplicated — the same URL twice is rejected.
- Plan section lists sub-topics; every sub-topic addressed in Findings.
- Counts line: `📊 Claims: N | Validated: N | Dropped: N` (Validated + Dropped = Claims).
- Verdict: COMPLETE / PARTIAL / INSUFFICIENT (PARTIAL and INSUFFICIENT disclose the gap).
- Run `matcha_research_validate` before finalizing; revisions re-validate fully.
- Persist via `persistTopic` on valid verdicts; sweep stale with `matcha_research_stale`.
