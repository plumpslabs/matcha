/**
 * 🍵 matcha — matcha-post-write.js
 * PostToolUse hook — cleanup enforcement after file writes/edits.
 * Scans modified files for common cleanup issues using the multi-language
 * pattern registry (patterns.json). Returns additionalContext so the
 * agent can self-correct.
 *
 * Matcha-style: simple, one file, deterministic, fast (<100ms).
 *
 * Registered in .claude/settings.json under PostToolUse.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { recordReviewIssue } from "./matcha-metrics.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Pattern Registry ─────────────────────────────────────────────────────────

let PATTERNS = null;

function loadPatterns() {
  if (PATTERNS) return PATTERNS;
  try {
    const raw = readFileSync(join(__dirname, "patterns.json"), "utf-8");
    PATTERNS = JSON.parse(raw);
    return PATTERNS;
  } catch {
    // Fallback to minimal JS-only patterns
    return {
      languages: {
        js: {
          extensions: [".js", ".jsx", ".mjs", ".cjs"],
          debugLog: ["console.log(", "console.debug(", "debugger"],
          emptyCatch: ["catch\\s*(\\(\\w+\\))?\\s*\\{\\s*\\}"],
          hardcodedSecret: ["(?:api[_-]?key|secret|password|token)\\s*[:=]\\s*[\"']"],
          todoFixme: ["\\/\\/\\s*(TODO|FIXME|HACK|XXX|TEMP)"],
        },
        ts: {
          extensions: [".ts", ".tsx", ".mts", ".cts"],
          debugLog: ["console.log(", "console.debug(", "debugger"],
          emptyCatch: ["catch\\s*(\\(\\w+\\))?\\s*\\{\\s*\\}"],
          hardcodedSecret: ["(?:api[_-]?key|secret|password|token)\\s*[:=]\\s*[\"']"],
          todoFixme: ["\\/\\/\\s*(TODO|FIXME|HACK|XXX|TEMP)"],
        },
      },
    };
  }
}

function detectLanguage(filePath) {
  const ext = "." + filePath.split(".").pop();
  const patterns = loadPatterns();
  for (const [lang, config] of Object.entries(patterns.languages || {})) {
    if (config.extensions && config.extensions.includes(ext)) {
      return { lang, config };
    }
  }
  return null;
}

// ─── Cleanup checks ──────────────────────────────────────────────────────────

/**
 * Check a file for cleanup issues using the pattern registry.
 * Returns array of findings.
 */
function scanFile(filePath) {
  if (!filePath || !existsSync(filePath)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const fileName = filePath.split(/[\\/]/).pop() || "";
  const findings = [];

  // Detect language
  const detected = detectLanguage(filePath);
  const langConfig = detected?.config;

  // Language-specific checks
  if (langConfig) {
    const checks = [
      { key: "debugLog", issue: "Debug log/statement left in code", fix: "Remove before commit, or use structured logger", severity: "minor" },
      { key: "emptyCatch", issue: "Empty catch block — error silently swallowed", fix: "Log the error at minimum", severity: "critical" },
      { key: "hardcodedSecret", issue: "Possible hardcoded credential", fix: "Move to environment variable: APPNAME_VAR_NAME", severity: "critical" },
      { key: "todoFixme", issue: "TODO/FIXME left in code", fix: "Resolve or create a tracking issue", severity: "minor" },
    ];

    for (const check of checks) {
      const rawPatterns = langConfig[check.key];
      if (!rawPatterns) continue;

      for (let i = 0; i < lines.length; i++) {
        for (const rawPattern of rawPatterns) {
          try {
            if (new RegExp(rawPattern).test(lines[i])) {
              findings.push({
                file: filePath,
                line: i + 1,
                issue: check.issue,
                fix: check.fix,
                severity: check.severity,
                language: detected.lang,
              });
              break;
            }
          } catch {
            // Skip invalid regex patterns
          }
        }
        if (findings.some((f) => f.issue === check.issue)) break;
      }
    }
  }

  // SQL checks (language-agnostic)
  const patterns = loadPatterns();
  if (patterns.sql) {
    const sqlChecks = [
      { key: "unboundedQuery", issue: "Unbounded query — no LIMIT clause", fix: "Add LIMIT or explicit comment why not needed", severity: "minor" },
      { key: "highOffset", issue: "High OFFSET value — consider cursor pagination", fix: "Use cursor-based pagination for large offsets", severity: "minor" },
      { key: "functionInWhere", issue: "Function in WHERE clause — index won't be used", fix: "Use computed column or raw comparison instead", severity: "minor" },
    ];

    for (const check of sqlChecks) {
      const rawPattern = patterns.sql[check.key];
      if (!rawPattern) continue;

      for (let i = 0; i < lines.length; i++) {
        try {
          if (new RegExp(rawPattern, "i").test(lines[i])) {
            findings.push({
              file: filePath,
              line: i + 1,
              issue: check.issue,
              fix: check.fix,
              severity: check.severity,
              language: "sql",
            });
            break;
          }
        } catch {
          // Skip
        }
      }
    }
  }

  // Matcha marker checks (language-agnostic — // matcha: ... comments)
  if (patterns.markers) {
    // NOTE: severities must be one of the render buckets in formatFindings
    // (critical | minor | info) or the finding is counted but never displayed.
    const markerChecks = [
      { key: "nonEnglishScript", issue: "Matcha marker not written in English (non-Latin script)", fix: "Rewrite in English: // matcha:explain <reason>", severity: "minor" },
      { key: "indonesianWords", issue: "Matcha marker contains Indonesian words — must be English", fix: "Rewrite in English: // matcha:explain <reason>", severity: "minor" },
      { key: "emptyOrPlaceholder", issue: "Matcha marker is empty or placeholder", fix: "Add a real English reason: // matcha:explain <reason>", severity: "info" },
    ];

    for (const check of markerChecks) {
      const rawPatterns = patterns.markers.checks?.[check.key]?.patterns;
      if (!rawPatterns) continue;

      for (let i = 0; i < lines.length; i++) {
        if (!/matcha:/.test(lines[i])) continue;
        for (const rawPattern of rawPatterns) {
          try {
            if (new RegExp(rawPattern, "i").test(lines[i])) {
              findings.push({
                file: filePath,
                line: i + 1,
                issue: check.issue,
                fix: check.fix,
                severity: check.severity,
                language: "marker",
                category: "marker",
              });
              break;
            }
          } catch {
            // Skip invalid regex patterns
          }
        }
        if (findings.some((f) => f.issue === check.issue)) break;
      }
    }
  }

  // Prose checks (markdown, txt)
  if (patterns.prose) {
    const proseExt = patterns.prose.extensions || [];
    if (proseExt.some((ext) => fileName.endsWith(ext))) {
      for (const [checkName, rawPatterns] of Object.entries(patterns.prose.checks || {})) {
        for (let i = 0; i < lines.length; i++) {
          for (const rawPattern of rawPatterns) {
            try {
              if (new RegExp(rawPattern, "i").test(lines[i])) {
                findings.push({
                  file: filePath,
                  line: i + 1,
                  issue: `${checkName} — writing quality`,
                  fix: "Simplify language",
                  severity: "info",
                  language: "prose",
                });
                break;
              }
            } catch {
              // Skip
            }
          }
          if (findings.some((f) => f.issue.includes(checkName))) break;
        }
      }
    }
  }

  // Commit message checks
  if (patterns.commit && fileName.toLowerCase().includes("commit_editmsg")) {
    const rawPattern = patterns.commit.vagueMessage;
    if (rawPattern) {
      for (let i = 0; i < lines.length; i++) {
        try {
          if (new RegExp(rawPattern, "i").test(lines[i].trim())) {
            findings.push({
              file: filePath,
              line: i + 1,
              issue: "Vague commit message",
              fix: "Use conventional format: 'type(scope): description'",
              severity: "info",
              language: "commit",
            });
            break;
          }
        } catch {
          // Skip
        }
      }
    }
  }

  return findings;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function formatFindings(findings) {
  if (findings.length === 0) return "";

  const critical = findings.filter((f) => f.severity === "critical");
  const minor = findings.filter((f) => f.severity === "minor");
  const info = findings.filter((f) => f.severity === "info");

  let msg = "🍵 matcha: cleanup check\n\n";

  if (critical.length > 0) {
    msg += "🔴 Critical:\n";
    for (const f of critical) {
      msg += `  ${f.file}:${f.line} — ${f.issue}`;
      if (f.language) msg += ` [${f.language}]`;
      msg += `\n  → ${f.fix}\n`;
    }
    msg += "\n";
  }

  if (minor.length > 0) {
    msg += "🟡 Minor:\n";
    for (const f of minor) {
      msg += `  ${f.file}:${f.line} — ${f.issue}`;
      if (f.language) msg += ` [${f.language}]`;
      msg += `\n  → ${f.fix}\n`;
    }
    msg += "\n";
  }

  if (info.length > 0) {
    msg += "🟢 Info:\n";
    for (const f of info) {
      msg += `  ${f.file}:${f.line} — ${f.issue}`;
      if (f.language) msg += ` [${f.language}]`;
      msg += `\n  → ${f.fix}\n`;
    }
    msg += "\n";
  }

  msg += "🧹 matcha says: review flagged issues before declaring done.";
  return msg;
}

// ─── Tool detection ──────────────────────────────────────────────────────────

const WRITE_TOOLS = ["Write", "Edit", "write", "edit", "WriteToFile", "EditFile"];

function parseEvent(event) {
  if (!event) return null;
  const toolName = event.tool || event.toolName || "";
  if (!WRITE_TOOLS.includes(toolName)) return null;

  const input = event.input || {};
  const output = event.output || {};
  return (input.path || input.filePath || input.file || output.path || output.filePath || "").trim() || null;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export async function postToolUse(event, context) {
  const filePath = parseEvent(event);
  if (!filePath) return null;

  const findings = scanFile(filePath);
  if (findings.length === 0) return null;

  // Record metrics
  for (const f of findings) {
    recordReviewIssue(f.category || "unknown", f.severity || "info", filePath);
  }

  return {
    additionalContext: formatFindings(findings),
    metadata: {
      hook: "matcha-post-write",
      findings_count: findings.length,
      critical_count: findings.filter((f) => f.severity === "critical").length,
    },
  };
}

export default async function handler(event, context) {
  return postToolUse(event, context);
}

// ─── CLI Mode ────────────────────────────────────────────────────────────────
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
        process.stdout.write(JSON.stringify({ additionalContext: "" }) + "\n");
        process.exit(0);
      }

      const findings = scanFile(filePath);
      if (findings.length === 0) {
        process.exit(0);
      }

      process.stdout.write(JSON.stringify({
        additionalContext: formatFindings(findings),
        metadata: {
          hook: "matcha-post-write",
          findings_count: findings.length,
          critical_count: findings.filter((f) => f.severity === "critical").length,
        },
      }) + "\n");
      process.exit(0);
    } catch (e) {
      process.stderr.write(`matcha-post-write: parse error — ${e.message}\n`);
      process.exit(0);
    }
  });
}
