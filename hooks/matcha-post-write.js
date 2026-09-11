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
import { getIntensity } from "./planning-gate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Pattern Registry ─────────────────────────────────────────────────────────

let PATTERNS = null;

function loadPatterns() {
  if (PATTERNS) return PATTERNS;
  try {
    const raw = readFileSync(join(__dirname, "patterns.json"), "utf-8");
    PATTERNS = JSON.parse(raw);
    return PATTERNS;
  } catch (e) {
    // Fail loud-ish: broken registry must not silently disable the scanner.
    process.stderr.write(`matcha-post-write: patterns.json unreadable — ${e.message}; falling back to minimal JS-only patterns\n`);
    return {
      exemptPaths: [],
      languages: {
        js: {
          extensions: [".js", ".jsx", ".mjs", ".cjs"],
          checks: {
            debugLog: { patterns: ["console\\.(log|debug|trace|info|warn)\\(", "debugger\\b"], severity: "warning", description: "Debug/console statements left in code" },
            emptyCatch: { patterns: ["catch\\s*(\\(\\s*\\w*\\s*\\))?\\s*\\{\\s*\\}"], severity: "error", description: "Empty catch block silently swallows errors" },
            hardcodedSecret: { patterns: ["(?:api[_-]?key|secret|password|token)\\s*[:=]\\s*[\"']"], severity: "critical", description: "Possible hardcoded credential/secret" },
            todoFixme: { patterns: ["\\/\\/\\s*(TODO|FIXME|HACK|XXX|TEMP)\\b"], severity: "info", description: "Unresolved TODO/FIXME marker" },
          },
        },
        ts: { extensions: [".ts", ".tsx", ".mts", ".cts"], extendsChecksFrom: "js", checks: {} },
      },
    };
  }
}

// Severity buckets used by formatFindings. Registry severities map onto these.
const SEVERITY_BUCKET = { critical: "critical", error: "critical", warning: "minor", info: "info" };

function resolveChecks(langConfig, lang, allLanguages) {
  // v4 registry: checks live under `checks` and may be inherited via extendsChecksFrom.
  const own = langConfig.checks || {};
  const parentName = langConfig.extendsChecksFrom;
  if (!parentName) return { checks: own, lang };
  const parent = allLanguages[parentName];
  if (!parent) return { checks: own, lang };
  // Child checks override same-named parent checks.
  return { checks: { ...(parent.checks || {}), ...own }, lang: parentName };
}

function detectLanguage(filePath) {
  const ext = "." + filePath.split(".").pop();
  const patterns = loadPatterns();
  for (const [lang, config] of Object.entries(patterns.languages || {})) {
    if (config.extensions && config.extensions.includes(ext)) {
      return resolveChecks(config, lang, patterns.languages || {});
    }
  }
  return null;
}

function pathExemptions(filePath) {
  const patterns = loadPatterns();
  const normalized = filePath.replace(/\\/g, "/");
  const exempt = new Set();
  for (const rule of patterns.exemptPaths || []) {
    try {
      if (new RegExp(rule.match).test(normalized)) {
        for (const c of rule.exemptChecks || []) exempt.add(c);
      }
    } catch {
      // Skip malformed exemption rules
    }
  }
  return exempt;
}

function checkExemptedInPaths() {
  // Reserved for future per-check path rules; path policy lives in exemptPaths (see scanFile).
  return false;
}

function lineJustified(line, justification, fineSeverity) {
  if (!justification) return false;
  // A matcha marker justifies any severity; a plain trailing comment only
  // justifies non-critical findings — critical ones need an explicit marker.
  const markerRaw = justification.markerPattern;
  if (markerRaw) {
    try {
      if (new RegExp(markerRaw).test(line)) return true;
    } catch {
      // Skip malformed justification patterns
    }
  }
  if (fineSeverity === "critical") return false;
  const commentRaw = justification.commentPattern;
  if (commentRaw) {
    try {
      if (new RegExp(commentRaw).test(line)) return true;
    } catch {
      // Skip malformed justification patterns
    }
  }
  return false;
}

function valueIgnored(line, ignoreValues) {
  if (!Array.isArray(ignoreValues) || ignoreValues.length === 0) return false;
  // Match against quoted literals on the line ("...", '...'), not the whole line,
  // so a value like "test" can't suppress an unrelated finding via substring collision.
  const literals = [...line.matchAll(/[\"']([^\"'\n]{0,120})[\"']/g)].map((m) => m[1]);
  return literals.some((val) => ignoreValues.includes(val));
}

function contextIgnored(line, ignoreContext) {
  if (!Array.isArray(ignoreContext)) return false;
  return ignoreContext.some((raw) => {
    try {
      return new RegExp(raw).test(line);
    } catch {
      return false;
    }
  });
}

// Per-check ignorePaths (language-specific idiom, e.g. go's _test.go files)
function pathIgnored(filePath, checkConfig) {
  const ignorePaths = checkConfig && checkConfig.ignorePaths;
  if (!Array.isArray(ignorePaths)) return false;
  const normalized = filePath.replace(/\\/g, "/");
  return ignorePaths.some((raw) => {
    try {
      return new RegExp(raw).test(normalized);
    } catch {
      return false;
    }
  });
}

// ─── Cleanup checks ──────────────────────────────────────────────────────────

/**
 * Check a file for cleanup issues using the pattern registry (v4 format:
 * languages.<lang>.checks.<check>.{patterns,severity,ignoreContext,ignoreValues,ignorePaths}
 * plus registry-level exemptPaths and justification rules).
 * Returns array of findings.
 */
export function scanFile(filePath) {
  if (!filePath || !existsSync(filePath)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const fileName = filePath.split(/[\\/]/).pop() || "";
  const findings = [];

  // Detect language (+ resolved checks, including extendsChecksFrom)
  const detected = detectLanguage(filePath);
  const patterns = loadPatterns();
  const justification = patterns.justification || null;
  const exemptChecks = pathExemptions(filePath);

  // Language-specific checks
  if (detected) {
    const { checks: langChecks, lang } = detected;

    for (const [checkKey, checkConfig] of Object.entries(langChecks)) {
      const rawPatterns = checkConfig && checkConfig.patterns;
      if (!rawPatterns || !Array.isArray(rawPatterns)) continue;
      if (exemptChecks.has(checkKey)) continue;
      if (checkExemptedInPaths(checkKey, filePath)) continue;
      if (pathIgnored(filePath, checkConfig)) continue;

      const issue = checkConfig.description || checkKey;
      const fix = checkConfig.fix || checkConfig.description || "Review this finding";
      const fineSeverity = checkConfig.severity || "warning";
      const severity = SEVERITY_BUCKET[fineSeverity] || "minor";
      let found = false;

      for (let i = 0; i < lines.length && !found; i++) {
        const line = lines[i];
        if (lineJustified(line, justification, fineSeverity)) continue;
        if (valueIgnored(line, checkConfig.ignoreValues)) continue;
        if (contextIgnored(line, checkConfig.ignoreContext)) continue;

        for (const rawPattern of rawPatterns) {
          try {
            if (new RegExp(rawPattern).test(line)) {
              findings.push({
                file: filePath,
                line: i + 1,
                issue,
                fix,
                severity,
                language: lang,
                check: checkKey,
              });
              found = true;
              break;
            }
          } catch {
            // Skip invalid regex patterns
          }
        }
      }
    }
  }

  // SQL checks (language-agnostic)
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
      for (const [checkName, checkObj] of Object.entries(patterns.prose.checks || {})) {
        const rawPatterns = Array.isArray(checkObj) ? checkObj : (checkObj && checkObj.patterns) || [];
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

export function formatFindings(findings) {
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
  const cwd = event?.cwd || process.cwd();
  if (getIntensity(cwd) === "off") return null;

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
      const cwd = event?.cwd || process.cwd();
      if (getIntensity(cwd) === "off") {
        process.stdout.write(JSON.stringify({ additionalContext: "" }) + "\n");
        process.exit(0);
      }

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
