/**
 * 🍵 matcha — matcha-post-write.js
 * PostToolUse hook — cleanup enforcement after file writes/edits.
 * Scans modified files for common cleanup issues and returns
 * additionalContext so the agent can self-correct.
 *
 * Matcha-style: simple, one file, deterministic, fast (<100ms).
 *
 * Registered in .claude/settings.json under PostToolUse.
 */

import { readFileSync, existsSync } from "fs";

// ─── Cleanup checks ──────────────────────────────────────────────────────────

/**
 * Patterns to scan for in source files after write/edit.
 * Each check returns { issue, line?, fix } or null.
 * Keep this list focused on matcha's 🧹 Cleanup checkpoint.
 */
const CHECKS = [
  {
    name: "debug-log",
    patterns: [
      /console\.(log|debug|trace)\(/,
      /\bprint\(/,
      /\bdebugger\b/,
    ],
    issue: "Debug log/statement left in code",
    fix: "Remove before commit, or use structured logger",
    severity: "minor",
  },
  {
    name: "todo-fixme",
    patterns: [
      /\/\/\s*(TODO|FIXME|HACK|XXX|TEMP)/i,
      /#\s*(TODO|FIXME|HACK|XXX|TEMP)/i,
      /<!--\s*(TODO|FIXME|HACK)/i,
    ],
    issue: "TODO/FIXME left in code",
    fix: "Resolve or create a tracking issue",
    severity: "minor",
  },
  {
    name: "empty-catch",
    patterns: [
      /catch\s*(\[\w+\]|\{\w+\}|\(\w+\))?\s*\{\s*\}/,
      /catch:\s*\{\s*\}/,
    ],
    issue: "Empty catch block — error silently swallowed",
    fix: "Log the error at minimum: catch (e) { logger.error(e) }",
    severity: "critical",
  },
  {
    name: "hardcoded-env",
    patterns: [
      /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'](?!https?:\/\/|env)/i,
    ],
    issue: "Possible hardcoded credential",
    fix: "Move to environment variable: APPNAME_VAR_NAME",
    severity: "critical",
  },
];

// ─── Writing quality checks (matcha writing-style.md) ────────────────────────

/**
 * Writing quality patterns for prose files (.md, .txt, COMMIT_EDITMSG).
 * Mirrors rules from rules/common/writing-style.md.
 * Only checks mechanically detectable patterns — semantic rules (e.g.
 * "comment should explain why not what") are enforced via agent system prompt.
 */
const WRITING_CHECKS = [
  {
    name: "filler-phrases",
    patterns: [
      /in order to/i,
      /due to the fact that/i,
      /it is important to note that/i,
      /at this point in time/i,
      /it is worth noting that/i,
      /it should be noted that/i,
      /may potentially/i,
      /could possibly/i,
      /in the event that/i,
      /it may be necessary to/i,
    ],
    issue: "Filler phrase — makes sentence longer without adding info",
    fix: "Replace with simpler word: 'in order to' → 'to', 'due to the fact that' → 'because'",
    severity: "info",
    scope: [".md", ".txt", ".rst", "COMMIT_EDITMSG"],
  },
  {
    name: "passive-voice",
    patterns: [
      /\b(?:was|were)\s+\w+ed\b/i,
      /\b(?:has been|have been|had been)\s+\w+ed\b/i,
      /\b(?:is being|are being|was being)\s+\w+ed\b/i,
      /\b(?:will be|would be|can be|could be)\s+\w+ed\b/i,
    ],
    issue: "Passive voice — hides who did the action",
    fix: "Use active voice: 'X was done by Y' → 'Y did X'",
    severity: "info",
    scope: [".md", ".txt", ".rst", "COMMIT_EDITMSG"],
  },
  {
    name: "dead-words",
    patterns: [
      /\bleverage(?:ing|d|s)?\b/i,
      /\bcutting[ -]edge\b/i,
      /\bgame[ -]changing\b/i,
      /\bsynerg(?:y|ize|istic)\b/i,
      /\bparadigm shift\b/i,
      /\bdisrupt(?:ive|ion|ing)?\b/i,
      /\bworld[ -]class\b/i,
      /\bbest[ -]in[ -]class\b/i,
      /\bdrill[ -]down\b/i,
      /\bdeep[ -]dive\b/i,
    ],
    issue: "Dead/meaningless buzzword — says nothing concrete",
    fix: "Replace with specific description of what it actually does",
    severity: "info",
    scope: [".md", ".txt", ".rst", "COMMIT_EDITMSG"],
  },
  {
    name: "vague-commit",
    patterns: [
      /^(fix\s+bug|fixed\s+bug|bug\s+fix|update|updated|changes?|minor|WIP|wip|refactor|lint|format|typo|cleanup|oops)$/i,
    ],
    issue: "Vague commit message — what exactly changed?",
    fix: "Use conventional format: 'type(scope): brief description' (e.g. 'fix(auth): handle expired token')",
    severity: "info",
    scope: ["COMMIT_EDITMSG"],
  },
];

/**
 * Check if a filename matches the scope of a writing check.
 */
function matchesScope(scope, fileName) {
  if (!scope || scope.length === 0) return true;
  const lowerName = fileName.toLowerCase();
  return scope.some(s => {
    if (s === "COMMIT_EDITMSG") return lowerName.includes("commit_editmsg") || lowerName === "commit-editmsg";
    return lowerName.endsWith(s.toLowerCase());
  });
}

const WRITE_TOOLS = ["Write", "Edit", "write", "edit", "WriteToFile", "EditFile"];

/**
 * Parse tool name and file path from a Claude Code PostToolUse event.
 */
function parseEvent(event) {
  if (!event) return null;
  const toolName = event.tool || event.toolName || "";
  if (!WRITE_TOOLS.includes(toolName)) return null;

  // Extract file path — varies by tool
  const input = event.input || {};
  const output = event.output || {};
  const filePath = input.path || input.filePath || input.file || output.path || output.filePath || "";
  return filePath.trim() || null;
}

/**
 * Scan a file for cleanup issues + writing quality issues.
 * Returns array of findings, or empty array if clean.
 */
function scanFile(filePath) {
  if (!filePath || !existsSync(filePath)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const fileName = filePath.split(/[\\/]/).pop() || "";
  const findings = [];

  // Run cleanup checks (all files)
  for (const check of CHECKS) {
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of check.patterns) {
        if (pattern.test(lines[i])) {
          findings.push({
            file: filePath,
            line: i + 1,
            issue: check.issue,
            fix: check.fix,
            severity: check.severity,
          });
          // Only report first match per check type per file
          break;
        }
      }
      if (findings.some(f => f.issue === check.issue)) break;
    }
  }

  // Run writing quality checks (prose files only)
  for (const check of WRITING_CHECKS) {
    // Skip if this file type doesn't match the check's scope
    if (!matchesScope(check.scope, fileName)) continue;

    // For writing checks, scan the full content for matches
    // and report the first match per check type
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of check.patterns) {
        if (pattern.test(lines[i])) {
          findings.push({
            file: filePath,
            line: i + 1,
            issue: check.issue,
            fix: check.fix,
            severity: check.severity,
          });
          break;
        }
      }
      if (findings.some(f => f.issue === check.issue)) break;
    }
  }

  return findings;
}

/**
 * Format findings as a readable string for additionalContext.
 */
function formatFindings(findings) {
  if (findings.length === 0) return "";

  const critical = findings.filter(f => f.severity === "critical");
  const minor = findings.filter(f => f.severity === "minor");
  const info = findings.filter(f => f.severity === "info");

  let msg = "🍵 matcha: cleanup check\n\n";

  if (critical.length > 0) {
    msg += "🔴 Critical:\n";
    for (const f of critical) {
      msg += `  ${f.file}:${f.line} — ${f.issue}\n`;
      msg += `  → ${f.fix}\n`;
    }
    msg += "\n";
  }

  if (minor.length > 0) {
    msg += "🟡 Minor:\n";
    for (const f of minor) {
      msg += `  ${f.file}:${f.line} — ${f.issue}\n`;
      msg += `  → ${f.fix}\n`;
    }
    msg += "\n";
  }

  if (info.length > 0) {
    msg += "🟢 Writing style:\n";
    for (const f of info) {
      msg += `  ${f.file}:${f.line} — ${f.issue}\n`;
      msg += `  → ${f.fix}\n`;
    }
    msg += "\n";
  }

  msg += "🧹 matcha says: review flagged issues before declaring done.";
  return msg;
}

// ─── Exports for programmatic use ────────────────────────────────────────────

export async function postToolUse(event, context) {
  const filePath = parseEvent(event);
  if (!filePath) return null;

  const findings = scanFile(filePath);
  if (findings.length === 0) return null;

  return {
    additionalContext: formatFindings(findings),
    metadata: {
      hook: "matcha-post-write",
      findings_count: findings.length,
      critical_count: findings.filter(f => f.severity === "critical").length,
    },
  };
}

export default async function handler(event, context) {
  return postToolUse(event, context);
}

// ─── CLI Mode — for Claude Code PostToolUse hook ────────────────────────────
// When invoked as: node hooks/matcha-post-write.js
// Reads event JSON from stdin, writes additionalContext to stdout.
const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-post-write.js") ||
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-post-write")
);

if (isDirectInvocation) {
  let input = "";
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    try {
      const event = JSON.parse(input);
      const filePath = parseEvent(event);

      if (!filePath) {
        // Not a write/edit tool — no context to add
        process.stdout.write(JSON.stringify({ additionalContext: "" }) + "\n");
        process.exit(0);
      }

      const findings = scanFile(filePath);
      if (findings.length === 0) {
        // File is clean
        process.exit(0);
      }

      // Return findings as additionalContext
      process.stdout.write(JSON.stringify({
        additionalContext: formatFindings(findings),
        metadata: {
          hook: "matcha-post-write",
          findings_count: findings.length,
          critical_count: findings.filter(f => f.severity === "critical").length,
        },
      }) + "\n");
      process.exit(0);
    } catch (e) {
      // Fail open — don't block the workflow for a review hook
      process.stderr.write(`matcha-post-write: parse error — ${e.message}\n`);
      process.exit(0);
    }
  });
}
