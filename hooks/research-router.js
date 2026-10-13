/**
 * 🍵 matcha — Research Provider Router
 *
 * Tiered external retrieval: free-first, paid only when measured need.
 * Evidence: coding-docs task completion Exa-deep 83% > Tavily-advanced 60% >
 * Brave 28%; Brave cheapest/fastest for news; Exa best for semantic/code.
 *
 * Tiers (env keys):
 *   - free (no key): Brave/DuckDuckGo search + Jina/Readability extract + local PDF
 *   - exa (EXA_API_KEY): code docs, semantic discovery, find-similar
 *   - tavily (TAVILY_API_KEY): general deep research, citations
 *
 * Used by: researcher prompt guidance, unit tests.
 */

/**
 * Route a query to a retrieval tier.
 * @param {string} query
 * @param {{exaKey?: boolean, tavilyKey?: boolean}} [keys]
 * @returns {{tier: "free"|"exa"|"tavily", reason: string}}
 */
export function routeResearchQuery(query, keys = {}) {
  const q = String(query || "").toLowerCase();
  const hasExa = Boolean(keys.exaKey || process.env.EXA_API_KEY);
  const hasTavily = Boolean(keys.tavilyKey || process.env.TAVILY_API_KEY);

  const newsish = /breaking|today|latest|news|this (morning|week)|just (announced|released|launched)/.test(q);
  if (newsish) {
    return { tier: "free", reason: "news/freshness → free tier (Brave), fastest + cheapest" };
  }

  const codeish = /api|sdk|docs?|documentation|github|code|function|library|framework|error|stack trace|changelog|migration/.test(q);
  if (codeish && hasExa) {
    return { tier: "exa", reason: "code/docs semantic retrieval → Exa deep (best task completion)" };
  }

  const deepish = q.split(/\s+/).length > 8 || /compar|versus|vs\.? |evaluate|survey|landscape|best practices/.test(q);
  if (deepish && hasTavily) {
    return { tier: "tavily", reason: "multi-aspect research → Tavily advanced (citations)" };
  }
  if (deepish && hasExa) {
    return { tier: "exa", reason: "multi-aspect research, no Tavily key → Exa deep fallback" };
  }

  return { tier: "free", reason: "default free-first: search + highlights extract, zero setup" };
}

/**
 * Extraction guidance: highlights-first caps per source kind.
 * @param {"web"|"pdf"|"docs"} kind
 * @returns {{budget: number, note: string}}
 */
export function extractionBudget(kind) {
  switch (kind) {
    case "pdf":
      return { budget: 4000, note: "PDF text layer first, capped; page refs required" };
    case "docs":
      return { budget: 2000, note: "API refs: excerpt the passage, not the page" };
    default:
      return { budget: 2000, note: "highlights-first (~500ch-2k), raw only at final synthesis" };
  }
}
