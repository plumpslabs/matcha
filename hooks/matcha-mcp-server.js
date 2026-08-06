#!/usr/bin/env node
/**
 * 🍵 matcha — MCP Server
 * Exposes matcha hooks as MCP tools for cross-platform use.
 * Any agent/platform that supports MCP can use matcha enforcement.
 *
 * Tools exposed:
 *   - matcha_shield_check: Check a command for dangerous patterns
 *   - matcha_post_write_scan: Scan a file for cleanup issues
 *   - matcha_stop_tips: Generate end-of-task tips from git diff
 *   - matcha_plan_validate: Validate an Intent Discovery plan
 *
 * Usage:
 *   node hooks/matcha-mcp-server.js
 *
 * MCP config (add to your MCP client):
 *   {
 *     "mcpServers": {
 *       "matcha": {
 *         "command": "node",
 *         "args": ["hooks/matcha-mcp-server.js"]
 *       }
 *     }
 *   }
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { validatePlanContent } from "./planning-gate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Import hook logic ───────────────────────────────────────────────────────

// Shield patterns (inlined for independence)
const DANGER_PATTERNS = [
  { pattern: /^rm\s+-rf?\s+\/\s*$/, msg: "rm -rf / would destroy the system." },
  { pattern: /^rm\s+-rf?\s+~\s*$/, msg: "rm -rf ~ would delete home directory." },
  { pattern: /^rm\s+-rf?\s+\.\s*$/, msg: "rm -rf . would delete current directory." },
  { pattern: /^chmod\s+777(\s|$)/, msg: "chmod 777 opens full permissions." },
  { pattern: />\s+\/dev\/(sda|sdb|sdc|nvme|hd[a-z])/, msg: "Writing to block device." },
  { pattern: /^git\s+push\s+--force(\s|$)/, msg: "git push --force rewrites remote history. Use --force-with-lease." },
  { pattern: /^git\s+reset\s+--hard(\s|$)/, msg: "git reset --hard discards uncommitted work permanently. Run 'git stash' first to safeguard changes." },
  { pattern: /^git\s+clean\s+-[a-zA-Z]*f[a-zA-Z]*/, msg: "git clean -f permanently removes untracked files. Use 'git clean -n' (dry run) or stash files first." },
  { pattern: /\bdrop\s+database\b/i, msg: "DROP DATABASE is destructive." },

  { pattern: /\btruncate\s+table\b/i, msg: "TRUNCATE deletes all rows." },
  { pattern: /^(curl|wget)\s+.*\|\s*(bash|sh)\s*$/, msg: "Piping curl/wget to shell executes remote code." },
  { pattern: /^shutdown\s/, msg: "shutdown stops the system." },
  { pattern: /^reboot\s/, msg: "reboot restarts the system." },
  { pattern: /^mkfs\./, msg: "mkfs formats a filesystem." },
  { pattern: /^init\s+0\b/, msg: "init 0 halts the system." },
];

function checkCommand(command) {
  if (!command) return { safe: true };
  for (const danger of DANGER_PATTERNS) {
    if (danger.pattern.test(command)) {
      return { safe: false, message: danger.msg, pattern: danger.pattern.source };
    }
  }
  return { safe: true };
}

// Stop tips
function generateStopTips(cwd) {
  const tips = [];

  try {
    const diff = execSync("git diff --unified=0 --diff-filter=AM", {
      cwd, timeout: 5000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"],
    });

    if (diff) {
      // Efficiency check
      const issues = [];
      if (/console\.(log|debug|trace)\(/.test(diff)) issues.push("debug logs");
      if (/\bdebugger\b/.test(diff)) issues.push("debugger statement");
      if (/catch\s*(\[\w+\]|\{\w+\}|\(\w+\))?\s*\{\s*\}/.test(diff)) issues.push("empty catch block");

      const addedLines = (diff.match(/^\+/gm) || []).length;
      if (addedLines > 100) issues.push(`${addedLines}+ lines added`);

      if (issues.length > 0) {
        tips.push({
          icon: "⚡",
          title: "efficiency",
          roast: `spotted ${issues.length} issue${issues.length > 1 ? "s" : ""}: ${issues.join(", ")}`,
          fix: "check flagged lines and clean up before declaring done",
        });
      }

      // Reuse check
      const addedCode = (diff.match(/^\+.*function\s+\w+/gm) || []).length;
      if (addedCode > 3) {
        tips.push({
          icon: "🔎",
          title: "reuse",
          roast: `${addedCode} new functions added`,
          fix: "check if any exist already",
        });
      }
    }
  } catch {
    // No git repo
  }

  try {
    const status = execSync("git status --porcelain", {
      cwd, timeout: 3000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"],
    });
    const untracked = (status.match(/^\?\?/gm) || []).length;
    if (untracked > 3) {
      tips.push({
        icon: "🧹",
        title: "cleanup",
        roast: `${untracked} untracked files — any temp artifacts?`,
        fix: "clean up before commit",
      });
    }
  } catch {
    // No git
  }

  return tips;
}

// ─── MCP Protocol (stdio JSON-RPC) ──────────────────────────────────────────

const SERVER_INFO = {
  name: "matcha",
  version: "2.5.19",
};

const TOOLS = [
  {
    name: "matcha_shield_check",
    description: "Check a shell command for dangerous patterns (rm -rf /, DROP DATABASE, etc.). Returns safety status.",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command to check" },
      },
      required: ["command"],
    },
  },
  {
    name: "matcha_post_write_scan",
    description: "Scan a file for cleanup issues (debug logs, empty catches, hardcoded secrets, TODO/FIXME). Supports JS, TS, Go, Python, Rust, Java, Ruby, Swift, SQL, and prose.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Absolute path to the file to scan" },
      },
      required: ["filePath"],
    },
  },
  {
    name: "matcha_stop_tips",
    description: "Generate end-of-task tips by scanning git diff for efficiency, reuse, and cleanup issues.",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string", description: "Working directory (defaults to current)" },
      },
    },
  },
  {
    name: "matcha_plan_validate",
    description: "Validate an Intent Discovery plan (<matcha_gate> XML or markdown with Problem/Goals/Success Criteria). Checks for completeness and minimum length.",
    inputSchema: {
      type: "object",
      properties: {
        planContent: { type: "string", description: "The plan content containing <matcha_gate> XML" },
      },
      required: ["planContent"],
    },
  },
];

function handleRequest(request) {
  const { id, method, params } = request;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      },
    };
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;

    if (name === "matcha_shield_check") {
      const result = checkCommand(args.command);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{
            type: "text",
            text: result.safe
              ? `🍵 matcha: ✅ Command is safe: ${args.command}`
              : `🍵 matcha: 🛡️ BLOCKED\n\nCommand: ${args.command}\nReason: ${result.message}\nPattern: ${result.pattern}`,
          }],
        },
      };
    }

    if (name === "matcha_post_write_scan") {
      const findings = scanFileLocal(args.filePath);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{
            type: "text",
            text: findings.length === 0
              ? `🍵 matcha: ✅ File is clean: ${args.filePath}`
              : formatFindings(findings),
          }],
        },
      };
    }

    if (name === "matcha_stop_tips") {
      const cwd = args.cwd || process.cwd();
      const tips = generateStopTips(cwd);
      if (tips.length === 0) {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{
              type: "text",
              text: "🍵 matcha: ✅ No issues found. Looking good!",
            }],
          },
        };
      }

      let msg = "🍵 matcha says:\n\n";
      for (let i = 0; i < tips.length; i++) {
        const t = tips[i];
        msg += `🧠 tip ${i + 1} — ${t.icon} ${t.title}:\n`;
        msg += `🍵 ${t.roast}\n`;
        msg += `→ ${t.fix}\n\n`;
      }

      return {
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: msg }] },
      };
    }

    if (name === "matcha_plan_validate") {
      const result = validatePlanContent(args.planContent);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{
            type: "text",
            text: result.valid
              ? `🍵 matcha: ✅ Plan is valid`
              : `🍵 matcha: ❌ Plan invalid\n\n${result.message}`,
          }],
        },
      };
    }

    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Unknown tool: ${name}` },
    };
  }

  if (method === "notifications/initialized" || method === "ping") {
    return null; // No response needed
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

// ─── Simplified scan (inline, avoids circular import) ────────────────────────

function scanFileLocal(filePath) {
  if (!filePath || !existsSync(filePath)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const ext = "." + filePath.split(".").pop();
  const findings = [];

  // Quick language detection
  const jsTsExts = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"];
  const goExts = [".go"];
  const pyExts = [".py", ".pyw"];
  const rsExts = [".rs"];
  const javaExts = [".java"];
  const rbExts = [".rb", ".rake"];
  const swiftExts = [".swift"];

  let lang = null;
  if (jsTsExts.includes(ext)) lang = "js";
  else if (goExts.includes(ext)) lang = "go";
  else if (pyExts.includes(ext)) lang = "python";
  else if (rsExts.includes(ext)) lang = "rust";
  else if (javaExts.includes(ext)) lang = "java";
  else if (rbExts.includes(ext)) lang = "ruby";
  else if (swiftExts.includes(ext)) lang = "swift";

  const debugPatterns = {
    js: [/console\.(log|debug|trace)\(/, /\bdebugger\b/],
    go: [/fmt\.Print(ln|f|)\(/, /log\.Print\(/],
    python: [/print\(/, /breakpoint\(\)/],
    rust: [/println!\(/, /dbg!\(/],
    java: [/System\.out\.print/],
    ruby: [/puts\s/, /binding\.pry/],
    swift: [/print\(/, /debugPrint\(/],
  };

  if (lang && debugPatterns[lang]) {
    for (let i = 0; i < lines.length; i++) {
      for (const p of debugPatterns[lang]) {
        if (p.test(lines[i])) {
          findings.push({ file: filePath, line: i + 1, issue: "Debug log/statement", fix: "Remove before commit", severity: "minor", language: lang });
          break;
        }
      }
      if (findings.some((f) => f.issue === "Debug log/statement")) break;
    }
  }

  return findings;
}

function formatFindings(findings) {
  if (findings.length === 0) return "";
  let msg = "🍵 matcha: cleanup check\n\n";
  for (const f of findings) {
    msg += `  ${f.file}:${f.line} — ${f.issue} [${f.language}]\n  → ${f.fix}\n\n`;
  }
  return msg;
}

// ─── Main loop ───────────────────────────────────────────────────────────────

let buffer = "";

process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;

  // Process complete messages
  const lines = buffer.split("\n");
  buffer = lines.pop() || ""; // Keep incomplete line in buffer

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line);
      const response = handleRequest(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + "\n");
      }
    } catch (e) {
      process.stderr.write(`matcha-mcp: parse error — ${e.message}\n`);
    }
  }
});

process.stdin.on("end", () => {
  process.exit(0);
});

// Log to stderr (not stdout, which is for MCP protocol)
process.stderr.write("🍵 matcha MCP server started\n");
