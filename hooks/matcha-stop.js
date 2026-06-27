/**
 * 🍵 matcha — matcha-stop.js
 * Stop event hook — deterministic end-of-task suggestions.
 * Replaces prompt-based "surface 3 matcha tips" with a structured hook
 * that scans git diff for common issues and outputs actionable tips.
 *
 * Matcha-style: simple, one file, deterministic, fast (<200ms).
 *
 * Registered in .claude/settings.json under Stop.
 */

import { execSync } from "child_process";

// ─── Tip generators ──────────────────────────────────────────────────────────

/**
 * Tip 1: Efficiency — scan for code quality red flags.
 * Scans git diff for common patterns.
 */
function tipEfficiency(cwd) {
  try {
    const diff = execSync("git diff --unified=0 --diff-filter=AM", {
      cwd,
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (!diff) return null;

    const issues = [];

    // Check for debug code
    if (/console\.(log|debug|trace)\(/.test(diff)) {
      issues.push("debug logs left in code");
    }
    if (/\bdebugger\b/.test(diff)) {
      issues.push("debugger statement");
    }

    // Check for empty catch
    if (/catch\s*(\[\w+\]|\{\w+\}|\(\w+\))?\s*\{\s*\}/.test(diff)) {
      issues.push("empty catch block");
    }

    // Check for long functions (proxy: lots of added lines in one function)
    const addedLines = (diff.match(/^\+/gm) || []).length;
    if (addedLines > 100) {
      issues.push(`${addedLines}+ lines added — consider splitting`);
    }

    if (issues.length === 0) return null;

    return {
      icon: "⚡",
      title: "efficiency",
      roast: `spotted ${issues.length} issue${issues.length > 1 ? "s" : ""}: ${issues.join(", ")}`,
      fix: `check flagged lines and clean up before declaring done`,
    };
  } catch {
    return null; // no git repo or diff unavailable
  }
}

/**
 * Tip 2: Overlap/Reuse — check for duplicate patterns.
 * Looks for repeated code blocks in the diff.
 */
function tipReuse(cwd) {
  try {
    const diff = execSync("git diff --diff-filter=AM", {
      cwd,
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (!diff) return null;

    // Quick check: look for repeated function-like patterns
    const addedCode = (diff.match(/^\+.*function\s+\w+/gm) || []).length;
    const addedFiles = (diff.match(/^\+{3}\s+b\/(.+)/gm) || []).length;

    if (addedCode > 3) {
      return {
        icon: "🔎",
        title: "reuse",
        roast: `${addedCode} new functions added in ${addedFiles || 1} file${addedFiles > 1 ? "s" : ""}`,
        fix: "check if any exist already via @matcha-finder",
      };
    }

    // Check for similar imports or patterns
    const imports = (diff.match(/^\+.*(?:import|require|from)\s+/gm) || []).length;
    if (imports > 5) {
      return {
        icon: "🔎",
        title: "reuse",
        roast: `${imports} new imports — could any be consolidated?`,
        fix: "check existing utils/helpers before adding new deps",
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Tip 3: Cleanup — check for temp artifacts and uncommitted files.
 */
function tipCleanup(cwd) {
  try {
    const findings = [];

    // Check for temp files in git status
    try {
      const status = execSync("git status --porcelain", {
        cwd,
        timeout: 3000,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      const untracked = (status.match(/^\?\?/gm) || []).length;
      if (untracked > 3) {
        findings.push(`${untracked} untracked files — any temp artifacts?`);
      }

      const modified = (status.match(/^ M|^M /gm) || []).length;
      if (modified > 5) {
        findings.push(`${modified} modified files — commit scope creeping?`);
      }
    } catch {
      // git status not available
    }

    // Check for common temp file patterns
    const tempPatterns = ["*.log", "*.tmp", "*.swp", ".DS_Store", "node_modules"];
    for (const pattern of tempPatterns) {
      try {
        const found = execSync(`git ls-files --others --exclude-standard "${pattern}" 2>/dev/null || true`, {
          cwd,
          timeout: 2000,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
        if (found) {
          const count = found.split("\n").length;
          findings.push(`${count} temp file${count > 1 ? "s" : ""} matching ${pattern}`);
          break; // one temp pattern tip is enough
        }
      } catch {
        // skip
      }
    }

    if (findings.length === 0) return null;

    return {
      icon: "🧹",
      title: "cleanup",
      roast: findings[0],
      fix: "run @matcha-cleaner or clean manually before commit",
    };
  } catch {
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function generateTips(cwd) {
  const tips = [];

  const efficiency = tipEfficiency(cwd);
  if (efficiency) tips.push(efficiency);

  const reuse = tipReuse(cwd);
  if (reuse) tips.push(reuse);

  const cleanup = tipCleanup(cwd);
  if (cleanup) tips.push(cleanup);

  return tips;
}

function formatTips(tips) {
  if (tips.length === 0) return "";

  let msg = "🍵 matcha says:\n\n";

  for (let i = 0; i < tips.length; i++) {
    const t = tips[i];
    msg += `🧠 tip ${i + 1} — ${t.icon} ${t.title}:\n`;
    msg += `🍵 ${t.roast}\n`;
    msg += `→ ${t.fix}\n\n`;
  }

  msg += "🧹 matcha: review the above before wrapping up.";
  return msg;
}

// ─── Exports for programmatic use ────────────────────────────────────────────

export async function onStop(event, context) {
  const cwd = process.cwd();
  const tips = generateTips(cwd);
  if (tips.length === 0) return null;

  return {
    additionalContext: formatTips(tips),
    metadata: {
      hook: "matcha-stop",
      tips_count: tips.length,
    },
  };
}

export default async function handler(event, context) {
  return onStop(event, context);
}

// ─── CLI Mode — for Claude Code Stop hook ────────────────────────────────────
// When invoked as: node hooks/matcha-stop.js
// Reads event JSON from stdin, outputs additionalContext to stdout.
const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-stop.js") ||
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-stop")
);

if (isDirectInvocation) {
  const cwd = process.cwd();
  const tips = generateTips(cwd);

  if (tips.length === 0) {
    // No issues — silent exit
    process.exit(0);
  }

  process.stdout.write(JSON.stringify({
    additionalContext: formatTips(tips),
    metadata: {
      hook: "matcha-stop",
      tips_count: tips.length,
    },
  }) + "\n");
  process.exit(0);
}
