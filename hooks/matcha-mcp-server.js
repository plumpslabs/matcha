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
 *   - matcha_review_validate: Validate a review verdict (tier, scope, file:line evidence, counts, verdict)
 *   - matcha_research_validate: Validate a research report (query, citations, counts, verdict)
 *   - matcha_research_lookup: Check the reference ledger + blocklist before fan-out
 *   - matcha_research_stale: Sweep stale dated entries needing re-research
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

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { validatePlanContent } from "./planning-gate.js";
import { validateReviewContent } from "./review-validate.js";
import { validateResearchContent } from "./research-validate.js";
import {
  findRelevant, isBlocked, parseIndex, parseLedger, addEntry, matchTopics, sweepStale,
  LEDGER_PATH, UNRELIABLE_PATH, RESEARCH_DIR, INDEX_PATH,
  UNRELIABLE_V2_PATH, MAX_TOPIC_FILES_PER_LOOKUP,
} from "./research-ledger.js";
import { getWorkspaceRoot } from "./workspace-root.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Import hook logic ───────────────────────────────────────────────────────

// Post-write scan + formatting imported from the hook (single implementation).
import { scanFile, formatFindings } from "./matcha-post-write.js";

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
  version: "2.6.12",
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
  {
    name: "matcha_review_validate",
    description: "Validate a review verdict structurally: Risk Tier (L0-L3), Scope, file:line evidence on every finding, severity counts matching findings, and a valid verdict (PASS / PASS_WITH_FIXES / BLOCK / EXPERT_REQUIRED). L2 must cover all 9 categories; L3 can never auto-pass. Blocks rubber-stamped reviews.",
    inputSchema: {
      type: "object",
      properties: {
        reviewContent: { type: "string", description: "The full review verdict text (🍵 matcha: review output)" },
      },
      required: ["reviewContent"],
    },
  },
  {
    name: "matcha_research_validate",
    description: "Validate a deep-research report: Query present, per-claim [N] citations resolving to listed Sources, counts line consistent (Validated + Dropped = Claims), valid verdict (COMPLETE / PARTIAL / INSUFFICIENT). Blocks unsourced reports.",
    inputSchema: {
      type: "object",
      properties: {
        reportContent: { type: "string", description: "The full research report text (🍵 matcha: research output)" },
        persistTopic: { type: "string", description: "Optional topic slug: on valid verdict, append the report Sources to .agents/research/<topic>.md (dedupe by URL)" },
      },
      required: ["reportContent"],
    },
  },
  {
    name: "matcha_research_stale",
    description: "Sweep ledger topic files for stale dated entries (older than maxAgeDays, default 180) needing re-research. Returns stale URLs with notes.",
    inputSchema: {
      type: "object",
      properties: {
        maxAgeDays: { type: "number", description: "Max age in days before an entry is stale" },
      },
      required: [],
    },
  },
  {
    name: "matcha_research_lookup",
    description: "Check the research reference ledger before fan-out: returns relevant validated sources for a query (zero scouts if fresh answer on file) and warns on blocklisted URLs. Never Twice for research.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The research question to look up" },
        urls: { type: "array", items: { type: "string" }, description: "Optional URLs to check against the blocklist" },
      },
      required: ["query"],
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
      const findings = scanFile(args.filePath);
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
      const cwd = args.cwd || getWorkspaceRoot();
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

    if (name === "matcha_review_validate") {
      const result = validateReviewContent(args.reviewContent);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{
            type: "text",
            text: result.valid
              ? `🍵 matcha: ✅ Verdict is valid (Tier: ${result.tier}, Verdict: ${result.verdict})`
              : `🍵 matcha: ❌ Verdict invalid\n\n${result.message}`,
          }],
        },
      };
    }

    if (name === "matcha_research_validate") {
      const result = validateResearchContent(args.reportContent);
      let persisted = "";
      // Opt-in persist: on valid verdict, append Sources to the topic file
      // (dedupe by URL). Explicit agent choice — never silent writes.
      const topic = String(args.persistTopic || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (result.valid && topic) {
        try {
          const root = getWorkspaceRoot();
          const dir = join(root, RESEARCH_DIR);
          mkdirSync(dir, { recursive: true });
          const file = `${topic}.md`;
          const rel = `${RESEARCH_DIR}/${file}`;
          let content = "";
          try {
            content = readFileSync(join(root, rel), "utf-8");
          } catch {}
          const srcMatch = String(args.reportContent).match(/## Sources([\s\S]*?)(?=\n📊|$)/i);
          let added = 0;
          if (srcMatch) {
            // Report sources are numbered ([1] URL) — not ledger dash lines.
            const today = new Date().toISOString().slice(0, 10);
            for (const m of srcMatch[1].matchAll(/^\s*\[\d+\]\s*(https?:\/\/[^\s)]+)\s*[—-]?\s*(.*)$/gim)) {
              const note = (m[2] || "validated source").trim() || "validated source";
              const next = addEntry(content, m[1], "grounded", note, today);
              if (next !== null) {
                content = next;
                added++;
              }
            }
          }
          if (added > 0 || content.trim()) {
            if (!content.trim()) content = `# ${topic}\n\n`;
            writeFileSync(join(root, rel), content.endsWith("\n") ? content : content + "\n", "utf-8");
          }
          // Index the topic so two-stage lookup can find it.
          let indexRaw = "";
          try {
            indexRaw = readFileSync(join(root, INDEX_PATH), "utf-8");
          } catch {}
          if (!parseIndex(indexRaw).some((t) => t.file === file)) {
            const line = `- [${topic.replace(/-/g, " ")}] — ${file}\n`;
            writeFileSync(join(root, INDEX_PATH), (indexRaw.trimEnd() ? indexRaw.trimEnd() + "\n" : "# 🍵 Research Topic Index\n\n") + line, "utf-8");
          }
          persisted = ` (persisted ${added} new source(s) to ${rel})`;
        } catch (e) {
          persisted = ` (persist failed: ${e.message})`;
        }
      }
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{
            type: "text",
            text: result.valid
              ? `🍵 matcha: ✅ Report is valid (Verdict: ${result.verdict})${persisted}`
              : `🍵 matcha: ❌ Report invalid\n\n${result.message}`,
          }],
        },
      };
    }

    if (name === "matcha_research_stale") {
      const root = getWorkspaceRoot();
      const maxAge = Number(args.maxAgeDays) > 0 ? Number(args.maxAgeDays) : 180;
      const stale = [];
      try {
        const indexRaw = readFileSync(join(root, INDEX_PATH), "utf-8");
        for (const t of parseIndex(indexRaw)) {
          const rel = t.file.startsWith(".agents/") ? t.file : `${RESEARCH_DIR}/${t.file.replace(/^\.\//, "")}`;
          let content = "";
          try {
            content = readFileSync(join(root, rel), "utf-8");
          } catch {
            continue;
          }
          for (const e of sweepStale(content, maxAge)) {
            stale.push({ file: rel, url: e.url, note: e.note, date: e.date });
          }
        }
      } catch {}
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{
            type: "text",
            text: stale.length === 0
              ? `🍵 matcha: ✅ No stale entries (>${maxAge} days)`
              : `🍵 matcha: ${stale.length} stale entr${stale.length > 1 ? "ies" : "y"} needing re-research:\n` +
                stale.map((e) => `- [${e.url}] — ${e.note} (${e.date}, in ${e.file})`).join("\n"),
          }],
        },
      };
    }

    if (name === "matcha_research_lookup") {
      const root = getWorkspaceRoot();
      const read = (rel) => {
        try {
          return readFileSync(join(root, rel), "utf-8");
        } catch {
          return "";
        }
      };
      // v2 two-stage lookup: index first, then only matched topic files.
      // Falls back to the legacy single-file ledger when no index exists.
      let hits = [];
      const indexRaw = read(INDEX_PATH);
      if (indexRaw.trim()) {
        const topics = matchTopics(parseIndex(indexRaw), args.query);
        for (const t of topics) {
          const rel = t.file.startsWith(".agents/") ? t.file : `${RESEARCH_DIR}/${t.file.replace(/^\.\//, "")}`;
          const content = read(rel);
          hits.push(...findRelevant(content, args.query, 5));
          if (hits.length >= 5) break;
        }
        hits = hits.slice(0, 5);
      } else {
        hits = findRelevant(read(LEDGER_PATH), args.query, 5);
      }
      const unreliable = read(UNRELIABLE_V2_PATH) || read(UNRELIABLE_PATH);
      const blocked = (Array.isArray(args.urls) ? args.urls : []).filter((u) => isBlocked(unreliable, u));
      const lines = hits.map((h) => `- [${h.url}] — ${h.note}${h.date ? ` (${h.date})` : ""}`);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{
            type: "text",
            text: [
              hits.length > 0
                ? `🍵 matcha: ledger hits (check freshness before reuse):\n${lines.join("\n")}`
                : "🍵 matcha: ledger empty for this query — proceed with fan-out",
              blocked.length > 0
                ? `⛔ blocklisted — never use: ${blocked.join(", ")}`
                : "",
            ].filter(Boolean).join("\n"),
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
