/**
 * 🍵 matcha — Review Verdict Validator
 *
 * Pure functions to structurally validate a review verdict. Mirrors
 * `validatePlanContent` in planning-gate.js — the plan gate has a deterministic
 * validator; the review gate deserves the same so agents cannot rubber-stamp a
 * PASS without tier, scope, per-finding evidence, and consistent counts.
 *
 * Used by:
 *   - MCP tool `matcha_review_validate` (hooks/matcha-mcp-server.js)
 *   - unit tests (tests/hook-modules.test.js)
 */

export const REVIEW_VERDICTS = ["PASS", "PASS_WITH_FIXES", "BLOCK", "EXPERT_REQUIRED"];
export const REVIEW_TIERS = ["L0", "L1", "L2", "L3"];

// The 9 L2 categories. Names deliberately match risk.md / commands/matcha:review.md.
export const L2_CATEGORIES = [
  "Correctness",
  "Performance",
  "Security",
  "Architecture",
  "Errors, Logging & Validation",
  "Resilience & Data",
  "Quality",
  "Testing",
  "Maintainability",
];

/**
 * Validate a review verdict string.
 * @param {string} content - Full review verdict text (🍵 matcha: review output).
 * @returns {{valid: boolean, message: string, tier: ?string, verdict: ?string}}
 */
export function validateReviewContent(content) {
  const s = String(content || "").trim();
  const issues = [];

  // 1. Risk tier present + valid
  const tierMatch = s.match(/Risk\s*Tier\s*:\s*(L[0-3])/i);
  const tier = tierMatch ? tierMatch[1].toUpperCase() : null;
  if (!tier || !REVIEW_TIERS.includes(tier)) {
    issues.push("Missing or invalid Risk Tier (expected L0-L3, e.g. 'Risk Tier: L2 (Product Logic)')");
  }

  // 2. Scope present (files/lines under review)
  if (!/Scope\s*:/.test(s)) {
    issues.push("Missing Scope (files/lines under review)");
  }

  // 3. Verdict present + valid
  const verdictMatch = s.match(/Verdict\s*:\s*([A-Z_]+)/i);
  const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : null;
  if (!verdict || !REVIEW_VERDICTS.includes(verdict)) {
    issues.push(`Missing or invalid Verdict (expected one of: ${REVIEW_VERDICTS.join(", ")})`);
  }

  // 4. Findings = lines that start with a severity emoji AND carry file:line evidence.
  //    Emoji in prose or section headers (e.g. "🔴 CRITICAL (must fix):") must NOT
  //    count as findings — otherwise counts mismatch falsely.
  const findingLines = s.split("\n").filter((line) => /^\s*(🔴|🟡|🟢)/.test(line));
  const evidenced = findingLines.filter((line) => /[\w./-]+:\d+/.test(line));
  const noEvidence = findingLines.filter((line) => !/[\w./-]+:\d+/.test(line));
  if (noEvidence.length > 0) {
    issues.push(`${noEvidence.length} finding(s) missing file:line evidence: ${noEvidence[0].trim()}`);
  }

  // 5. Severity counts must match actual findings (L2/L3 require the counts line).
  //    Only evidence-carrying finding lines count — headers/prose with emoji are ignored.
  const critCount = evidenced.filter((line) => line.trimStart().startsWith("🔴")).length;
  const warnCount = evidenced.filter((line) => line.trimStart().startsWith("🟡")).length;
  const infoCount = evidenced.filter((line) => line.trimStart().startsWith("🟢")).length;
  const countsMatch = s.match(/Critical\s*:\s*(\d+)\s*\|\s*Warning\s*:\s*(\d+)\s*\|\s*Info\s*:\s*(\d+)/i);
  if (countsMatch) {
    const [, c, w, i] = countsMatch;
    if (Number(c) !== critCount) issues.push(`Critical count mismatch: declared ${c}, found ${critCount}`);
    if (Number(w) !== warnCount) issues.push(`Warning count mismatch: declared ${w}, found ${warnCount}`);
    if (Number(i) !== infoCount) issues.push(`Info count mismatch: declared ${i}, found ${infoCount}`);
  } else if (tier === "L2" || tier === "L3") {
    issues.push("Missing counts line (expected '📊 Critical: N | Warning: N | Info: N')");
  }

  // 6. BLOCK must be backed by at least one CRITICAL finding
  if (verdict === "BLOCK" && critCount === 0) {
    issues.push("Verdict BLOCK but no 🔴 CRITICAL findings listed");
  }

  // 7. L3 can never auto-pass
  if (tier === "L3" && verdict !== "EXPERT_REQUIRED") {
    issues.push("L3 review cannot auto-pass — verdict must be EXPERT_REQUIRED");
  }

  // 8. L2 requires explicit per-category coverage — each of the 9 categories must be
  //    addressed as PASS or FINDINGS, not merely named. No silent skips, no rubber-stamp.
  if (tier === "L2") {
    const categoryStatus = new Map();
    for (const line of s.split("\n")) {
      for (const cat of L2_CATEGORIES) {
        const re = new RegExp(cat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        if (re.test(line)) {
          const status = /PASS|FINDINGS/i.test(line) ? line : null;
          if (status) categoryStatus.set(cat, status);
        }
      }
    }
    const missing = L2_CATEGORIES.filter((cat) => !categoryStatus.has(cat));
    if (missing.length > 0) {
      issues.push(`L2 review must address all 9 categories with PASS or FINDINGS — missing/blank: ${missing.join(", ")}`);
    }
  }

  return {
    valid: issues.length === 0,
    message: issues.length === 0 ? "Verdict is structurally valid" : issues.join("\n"),
    tier: tier || null,
    verdict: verdict || null,
  };
}
