/**
 * 🍵 matcha — blast-radius.js
 * Automated Blast-Radius & Risk Scorer.
 * Evaluates risk tier (L0-L3) based on git diff, file sensitivity,
 * security boundaries, dependency manifests, and line changes.
 *
 * Scoring:
 *   L0 (observe):   Docs, Markdown, CSS, styling, comments (≤20 LOC, low risk)
 *   L1 (low):       Minor feature/bugfix, 1-2 non-critical files
 *   L2 (enforce):   Standard product logic, routes, middleware, data access
 *   L3 (audit):     Auth, DB migrations, payment/billing, crypto, infrastructure, core deps
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "./workspace-root.js";

const SENSITIVITY_PATTERNS = {
  high: [
    /(^|\/)(auth|jwt|oauth|session|credentials|token|password)[\w.-]*/i,
    /(^|\/)(migration|schema|database|db|prisma)[\w.-]*\.(sql|prisma|ts|js|py|go)$/i,
    /(^|\/)(payment|billing|stripe|invoice|subscription)[\w.-]*/i,
    /(^|\/)(crypto|cipher|encryption|vault|kms)[\w.-]*/i,
    /(^|\/)(terraform|k8s|kubernetes|helm|docker-compose|dockerfile|\.env(\.|$))/i,
  ],
  medium: [
    /(^|\/)(middleware|routes?|controllers?|api|handlers?|services?)[\w.-]*/i,
    /(package\.json|Cargo\.toml|go\.mod|pom\.xml|build\.gradle|pyproject\.toml|requirements\.txt)$/i,
  ],
  low: [
    /\.(md|markdown|txt|rst|adoc)$/i,
    /\.(css|scss|sass|less|styl)$/i,
    /\.(png|jpg|jpeg|gif|svg|ico|webp)$/i,
  ],
};

/**
 * Calculate blast radius from changed files or git diff.
 * @param {string[]} [explicitFiles]
 * @param {string} [cwd]
 * @returns {{
 *   tier: "L0" | "L1" | "L2" | "L3",
 *   score: number,
 *   recommendedMode: "observe" | "enforce" | "audit",
 *   reasons: string[],
 *   stats: { filesChanged: number, linesAdded: number, linesDeleted: number }
 * }}
 */
export function calculateBlastRadius(explicitFiles, cwd) {
  const root = getWorkspaceRoot(cwd);
  let files = explicitFiles || [];
  let linesAdded = 0;
  let linesDeleted = 0;

  if (!explicitFiles || explicitFiles.length === 0) {
    try {
      const gitDiff = execSync("git diff --numstat HEAD 2>/dev/null || git diff --numstat 2>/dev/null || true", {
        cwd: root,
        encoding: "utf-8",
        timeout: 4000,
      }).trim();

      if (gitDiff) {
        files = [];
        for (const line of gitDiff.split("\n")) {
          const parts = line.split("\t");
          if (parts.length >= 3) {
            const add = parseInt(parts[0], 10) || 0;
            const del = parseInt(parts[1], 10) || 0;
            const file = parts[2].trim();
            linesAdded += add;
            linesDeleted += del;
            files.push(file);
          }
        }
      }
    } catch {}
  }

  // If still empty, check git status for untracked/modified
  if (files.length === 0) {
    try {
      const status = execSync("git status --porcelain 2>/dev/null || true", { cwd: root, encoding: "utf-8" }).trim();
      if (status) {
        files = status.split("\n").map(l => l.substring(3).trim()).filter(Boolean);
      }
    } catch {}
  }

  let score = 0;
  const reasons = [];

  if (files.length === 0) {
    return {
      tier: "L0",
      score: 0,
      recommendedMode: "observe",
      reasons: ["No files modified"],
      stats: { filesChanged: 0, linesAdded: 0, linesDeleted: 0 },
    };
  }

  let highCount = 0;
  let mediumCount = 0;
  let lowOnly = true;

  for (const f of files) {
    let matchedHigh = false;
    let matchedMedium = false;

    for (const pattern of SENSITIVITY_PATTERNS.high) {
      if (pattern.test(f)) {
        highCount++;
        score += 5;
        reasons.push(`High-risk security boundary: ${f}`);
        matchedHigh = true;
        lowOnly = false;
        break;
      }
    }

    if (!matchedHigh) {
      for (const pattern of SENSITIVITY_PATTERNS.medium) {
        if (pattern.test(f)) {
          mediumCount++;
          score += 2;
          reasons.push(`Medium-risk logic/dependency: ${f}`);
          matchedMedium = true;
          lowOnly = false;
          break;
        }
      }
    }

    if (!matchedHigh && !matchedMedium) {
      const isLow = SENSITIVITY_PATTERNS.low.some(p => p.test(f));
      if (!isLow) {
        lowOnly = false;
        score += 1;
      }
    }
  }

  const totalLines = linesAdded + linesDeleted;
  if (totalLines > 300) {
    score += 4;
    reasons.push(`Large diff (${totalLines} LOC modified)`);
  } else if (totalLines > 100) {
    score += 2;
    reasons.push(`Moderate diff (${totalLines} LOC modified)`);
  }

  if (files.length > 5) {
    score += 2;
    reasons.push(`Broad blast radius (${files.length} files touched)`);
  }

  let tier = "L2";
  let recommendedMode = "enforce";

  if (highCount > 0 || score >= 6) {
    tier = "L3";
    recommendedMode = "audit";
  } else if (lowOnly && totalLines <= 50) {
    tier = "L0";
    recommendedMode = "observe";
  } else if (score <= 2 && files.length <= 2 && totalLines <= 30) {
    tier = "L1";
    recommendedMode = "enforce";
  } else {
    tier = "L2";
    recommendedMode = "enforce";
  }

  return {
    tier,
    score,
    recommendedMode,
    reasons: reasons.length > 0 ? reasons : ["Standard application changes"],
    stats: {
      filesChanged: files.length,
      linesAdded,
      linesDeleted,
    },
  };
}
