/**
 * 🍵 matcha — Research Report Validator
 *
 * Structural validation for deep-research reports. Mirrors review-validate.js:
 * deterministic, no rubber-stamp — every claim must be grounded, counts must
 * match, dropped claims must be disclosed.
 *
 * Used by:
 *   - MCP tool `matcha_research_validate` (hooks/matcha-mcp-server.js)
 *   - unit tests (tests/hook-modules.test.js)
 */

export const RESEARCH_VERDICTS = ["COMPLETE", "PARTIAL", "INSUFFICIENT"];

/**
 * Validate a research report string.
 * @param {string} content - Full research report text (🍵 matcha: research output).
 * @returns {{valid: boolean, message: string, verdict: ?string}}
 */
export function validateResearchContent(content) {
  const s = String(content || "").trim();
  const issues = [];

  // 1. Query present
  if (!/Query\s*:/.test(s)) {
    issues.push("Missing Query (original research question)");
  }

  // 2. Verdict present + valid
  const verdictMatch = s.match(/Verdict\s*:\s*([A-Z_]+)/i);
  const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : null;
  if (!verdict || !RESEARCH_VERDICTS.includes(verdict)) {
    issues.push(`Missing or invalid Verdict (expected one of: ${RESEARCH_VERDICTS.join(", ")})`);
  }

  // 3. Sources section with at least one numbered source
  const sourcesMatch = s.match(/## Sources([\s\S]*)$/i);
  const sourcesBlock = sourcesMatch ? sourcesMatch[1] : "";
  const sources = sourcesBlock.split("\n").filter((line) => /^\s*\[\d+\]/.test(line));
  if (sources.length === 0) {
    issues.push("Missing Sources (at least one numbered [N] source required)");
  }

  // 4. Claims carry citations — finding lines live in ## Findings (plan
  //    checkboxes must NOT count as claims).
  const body = sourcesMatch ? s.slice(0, sourcesMatch.index) : s;
  const findingsMatch = body.match(/## Findings([\s\S]*?)(?=\n## |\n📊|$)/i);
  const findingsBlock = findingsMatch ? findingsMatch[1] : "";
  const claimLines = findingsBlock.split("\n").filter((line) => /^\s*-\s*\S/.test(line));
  const uncited = claimLines.filter((line) => !/\[\d+\]/.test(line));
  if (claimLines.length > 0 && uncited.length > 0) {
    issues.push(`${uncited.length} claim(s) missing source citation: ${uncited[0].trim().slice(0, 80)}`);
  }

  // 5. Every cited [N] must resolve to a listed source
  const maxSource = sources.length;
  const citedNums = new Set();
  for (const m of body.matchAll(/\[(\d+)\]/g)) citedNums.add(Number(m[1]));
  for (const n of citedNums) {
    if (n < 1 || n > maxSource) {
      issues.push(`Citation [${n}] has no matching source (only ${maxSource} listed)`);
    }
  }

  // 6b. Source dedupe — the same URL twice inflates authority.
  const urls = sources.map((line) => {
    const m = line.match(/https?:\/\/[^\s)]+/i);
    return m ? m[0].replace(/\/$/, "").toLowerCase() : line.trim().toLowerCase();
  });
  const seen = new Set();
  for (const u of urls) {
    if (seen.has(u)) {
      issues.push(`Duplicate source inflates authority: ${u.slice(0, 80)}`);
      break;
    }
    seen.add(u);
  }

  // 6c. Counts line must match actual claims (when present)
  const countsMatch = s.match(/Claims\s*:\s*(\d+)\s*\|\s*Validated\s*:\s*(\d+)\s*\|\s*Dropped\s*:\s*(\d+)/i);
  if (countsMatch) {
    const [, claims, validated, dropped] = countsMatch.map(Number);
    if (validated + dropped !== claims) {
      issues.push(`Counts mismatch: Validated (${validated}) + Dropped (${dropped}) ≠ Claims (${claims})`);
    }
    if (claimLines.length > 0 && validated > claimLines.length) {
      issues.push(`Validated count mismatch: declared ${validated}, only ${claimLines.length} claim lines shown`);
    }
    if (dropped === 0 && claimLines.length > 0 && validated !== claimLines.length) {
      issues.push(`No drops declared, so every claim line must be validated: declared ${validated}, found ${claimLines.length}`);
    }
  }

  // 7. INSUFFICIENT and PARTIAL must disclose the gap (dropped claims or
  //    explicit limitation). Note: only the body counts — the counts line
  //    itself contains "Dropped".
  if (verdict === "INSUFFICIENT" || verdict === "PARTIAL") {
    const droppedCount = countsMatch ? Number(countsMatch[3]) : 0;
    const bodyGap = /limitation|gap|missing|incomplete|unknown/i.test(body);
    if (droppedCount === 0 && !bodyGap) {
      issues.push(`Verdict ${verdict} must disclose the gap (dropped claims or limitation)`);
    }
  }

  // 8. Plan coverage — the report must show its sub-topics, and every
  //    sub-topic must be addressed in Findings (anti intent-neglect).
  const planMatch = body.match(/## Plan([\s\S]*?)(?=\n## |\n📊|$)/i);
  if (!planMatch) {
    issues.push("Missing ## Plan section (list sub-topics before findings)");
  } else {
    const planLines = planMatch[1].split("\n").filter((line) => /^\s*-\s*(?:\[[ x]\]\s*)?\S/.test(line));
    if (planLines.length === 0) {
      issues.push("## Plan has no sub-topics (at least one required)");
    } else {
      const findingsText = (body.match(/## Findings([\s\S]*?)(?=\n## |\n📊|$)/i) || ["", ""])[1];
      const uncovered = planLines.filter((line) => {
        const words = line.replace(/^\s*-\s*(?:\[[ x]\]\s*)?/, "").split(/\s+/)
          .filter((w) => w.length > 4).slice(0, 4);
        return !words.some((w) => new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(findingsText));
      });
      if (uncovered.length > 0) {
        issues.push(`${uncovered.length} plan sub-topic(s) never addressed in Findings: ${uncovered[0].trim().slice(0, 80)}`);
      }
    }
  }

  // 8b. Scope JSON — when a ## Scope section exists, it must parse as
  //     {question, summary, angles:[{label, query, rationale}]} with every
  //     angle complete. Structured scope beats prose plans.
  const scopeMatch = body.match(/## Scope([\s\S]*?)(?=\n## |\n📊|$)/i);
  if (scopeMatch) {
    const jsonText = scopeMatch[1].replace(/```json|```/g, "").trim();
    let scope = null;
    try {
      scope = JSON.parse(jsonText);
    } catch {
      issues.push("## Scope is not valid JSON (expected {question, summary, angles})");
    }
    if (scope) {
      if (!scope.question || !scope.summary) {
        issues.push("## Scope needs question + summary");
      }
      if (!Array.isArray(scope.angles) || scope.angles.length === 0) {
        issues.push("## Scope needs at least one angle");
      } else {
        scope.angles.forEach((a, i) => {
          if (!a || !a.label || !a.query || !a.rationale) {
            issues.push(`## Scope angle #${i + 1} needs label + query + rationale`);
          }
        });
      }
    }
  }

  // 9. High-stakes claims need 2+ independent sources. A claim line tagged
  //    [HIGH-STAKES] must cite at least two distinct [N].
  for (const line of claimLines) {
    if (/\[HIGH-STAKES\]/i.test(line)) {
      const nums = new Set([...line.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
      nums.delete(NaN);
      if (nums.size < 2) {
        issues.push(`HIGH-STAKES claim needs 2+ independent sources: ${line.trim().slice(0, 80)}`);
      }
    }
  }

  // 10. Dropped disclosure — Dropped > 0 requires a "dropped:" note in body.
  if (countsMatch && Number(countsMatch[3]) > 0 && !/dropped\s*:/i.test(body)) {
    issues.push("Dropped > 0 requires a 'dropped:' disclosure note in the body");
  }

  // 11. Freshness — time-sensitive reports need dated sources.
  if (/time-sensitive\s*:\s*yes/i.test(body)) {
    const dated = sources.filter((line) => /\b(19|20)\d{2}(-\d{2}(-\d{2})?)?\b/.test(line));
    if (dated.length === 0) {
      issues.push("Time-sensitive report needs dated sources (at least one YYYY[-MM[-DD]])");
    }
  }

  // 12. Evidence map — when a ## Evidence section exists, it must mirror
  //     Findings exactly: every claim line listed once with its citations,
  //     no extras, no omissions. Explicit claim↔source mapping beats prose.
  const evMatch = body.match(/## Evidence([\s\S]*?)(?=\n## |\n📊|$)/i);
  if (evMatch) {
    const evLines = evMatch[1].split("\n").filter((line) => /^\s*-\s*\S/.test(line));
    const norm = (l) => l.replace(/^\s*-\s*/, "").trim();
    const claimSet = new Set(claimLines.map(norm));
    const evSet = new Set(evLines.map(norm));
    for (const c of claimSet) {
      if (!evSet.has(c)) issues.push(`Evidence map omits claim: ${c.slice(0, 80)}`);
    }
    for (const e of evSet) {
      if (!claimSet.has(e)) issues.push(`Evidence map lists non-claim: ${e.slice(0, 80)}`);
    }
  }

  return {
    valid: issues.length === 0,
    message: issues.length === 0 ? "Report is structurally valid" : issues.join("\n"),
    verdict: verdict || null,
  };
}

/**
 * Validate a revision against its prior report — fights citation regression.
 * Sources silently dropped between versions must be named in the revised
 * report's dropped: note.
 * @param {string} prior - previous validated report
 * @param {string} revised - new report text
 * @returns {{valid: boolean, message: string, dropped: string[]}}
 */
export function validateResearchRevision(prior, revised) {
  const issues = [];
  const urlsOf = (text) => {
    const m = String(text || "").match(/## Sources([\s\S]*)$/i);
    if (!m) return [];
    return [...m[1].matchAll(/\[(\d+)\]\s*(https?:\/\/[^\s)]+)/gi)].map((x) => x[2].replace(/\/$/, "").toLowerCase());
  };
  const priorUrls = urlsOf(prior);
  const revisedUrls = new Set(urlsOf(revised));
  const dropped = priorUrls.filter((u) => !revisedUrls.has(u));
  const revBody = String(revised || "").toLowerCase();
  const undisclosed = dropped.filter((u) => !revBody.includes(u));
  if (undisclosed.length > 0) {
    issues.push(`Revision silently drops ${undisclosed.length} source(s), disclose in dropped:: ${undisclosed[0].slice(0, 80)}`);
  }
  return { valid: issues.length === 0, message: issues.length === 0 ? "Revision preserves citations" : issues.join("\n"), dropped };
}
