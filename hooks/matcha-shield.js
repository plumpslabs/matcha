/**
 * 🍵 matcha — matcha-shield.js
 * Deterministic safety gate. Blocks dangerous commands before they reach the OS.
 *
 * Dual-mode:
 *   1. CLI mode (used by Claude Code PreToolUse hook):
 *      Reads event JSON from stdin, exits with code 2 to block.
 *   2. Programmatic mode (ESM export):
 *      Returns { block, message } for dangerous commands.
 *
 * Override with env:
 *   MATCHA_SHIELD_OFF=true — disable all shield checks
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const HARNESS_STATE = join(ROOT, ".agents/harness.json");
const STATE_FILE = join(ROOT, ".agents/matcha-state.json");

function getHarnessProfile() {
  try {
    if (existsSync(HARNESS_STATE)) {
      const config = JSON.parse(readFileSync(HARNESS_STATE, "utf-8"));
      return config.name || "default";
    }
  } catch {}
  return "default";
}

function getIntensity() {
  try {
    if (existsSync(STATE_FILE)) {
      const state = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      return state.intensity || "enforce";
    }
  } catch {}
  return "enforce";
}

const DANGER_PATTERNS = [
  // ─── Destructive filesystem ──────────────────────────────────────────────
  {
    pattern: /^rm\s+-rf?\s+\/\s*$/,
    msg: "rm -rf / would destroy the system. Use specific paths.",
  },
  {
    pattern: /^rm\s+-rf?\s+~\s*$/,
    msg: "rm -rf ~ would delete home directory. Use specific paths.",
  },
  {
    pattern: /^rm\s+-rf?\s+\.\s*$/,
    msg: "rm -rf . would delete current directory. Use specific paths.",
  },

  // ─── Permissions ────────────────────────────────────────────────────────
  {
    pattern: /^chmod\s+777(\s|$)/,
    msg: "chmod 777 opens full permissions. Use 755 for dirs, 644 for files.",
  },

  // ─── Disk / block devices ─────────────────────────────────────────────────
  {
    pattern: />\s+\/dev\/(sda|sdb|sdc|nvme|hd[a-z])/,
    msg: "Writing to block device — would corrupt the disk.",
  },
  {
    pattern: /dd\s+if=.*of=\/dev\/(sda|sdb|sdc|nvme)/,
    msg: "dd to block device — would overwrite the disk.",
  },
  {
    pattern: /^mkfs\./,
    msg: "mkfs formats a filesystem — destroys all data on the device.",
  },

  // ─── Git destructive ──────────────────────────────────────────────────────
  {
    pattern: /^git\s+push\s+--force(\s|$)/,
    msg: "git push --force rewrites remote history. Use --force-with-lease.",
  },

  // ─── Production database ──────────────────────────────────────────────────
  {
    pattern: /\bdrop\s+database\b/i,
    msg: "DROP DATABASE is destructive. Only run on verified local/test DBs.",
  },
  {
    pattern: /\btruncate\s+table\b/i,
    msg: "TRUNCATE deletes all rows. Use DELETE with WHERE if possible.",
  },

  // ─── Remote code execution ────────────────────────────────────────────────
  {
    pattern: /^(curl|wget)\s+.*\|\s*(bash|sh)\s*$/,
    msg: "Piping curl/wget to shell executes remote code. Verify source first.",
  },

  // ─── System commands ──────────────────────────────────────────────────────
  {
    pattern: /^shutdown\s/,
    msg: "shutdown stops the system. Did you mean to restart a service?",
  },
  {
    pattern: /^reboot\s/,
    msg: "reboot restarts the system. Did you mean to restart a service?",
  },
  {
    pattern: /^init\s+0\b/,
    msg: "init 0 halts the system.",
  },
];

function checkCommand(command) {
  if (!command) return null;
  for (const danger of DANGER_PATTERNS) {
    if (danger.pattern.test(command)) {
      return {
        isDangerous: true,
        message: `🍵 matcha: shield blocked\n\nCommand: ${command}\nReason: ${danger.msg}\n\nOverride: MATCHA_SHIELD_OFF=true`,
        blockedPattern: danger.pattern.source,
      };
    }
  }
  return null;
}

function parseEvent(event) {
  if (!event) return null;
  const toolName = event.tool || event.toolName || "";
  if (!["Bash", "ExecuteCommand", "bash", "execute_command"].includes(toolName))
    return null;
  return (event.input?.command || event.input?.code || "").trim() || null;
}

export function checkPlanningGate(event) {
  if (!event) return null;

  const intensity = getIntensity();
  if (intensity === "observe") {
    return null;
  }

  const toolName = event.tool || event.toolName || "";
  const input = event.input || {};

  const isWriteTool = [
    "WriteFile", "EditFile", "write_to_file", "replace_file_content",
    "multi_replace_file_content", "precise_diff_editor", "batch_file_writer",
    "edit_symbol", "edit_symbol_surgical", "patch"
  ].includes(toolName);

  const isCommandTool = [
    "Bash", "ExecuteCommand", "bash", "execute_command"
  ].includes(toolName);

  if (!isWriteTool && !isCommandTool) return null;

  if (isWriteTool) {
    const targetFile = input.path || input.TargetFile || input.filePath || "";
    const files = input.files || [];
    const isWritingPlan = targetFile.endsWith("matcha-plan.md") ||
                          targetFile.endsWith("matcha-state.json") ||
                          files.some(f => f.path?.endsWith("matcha-plan.md") || f.path?.endsWith("matcha-state.json"));
    if (isWritingPlan) return null;
  }

  if (isCommandTool) {
    const cmd = (input.command || input.code || "").trim();
    const isSafe = /^(git status|git diff|npm test|vitest|find |ls |cat |grep |agy status)/i.test(cmd);
    if (isSafe) return null;
  }

  const planPath = join(ROOT, ".agents/matcha-plan.md");
  if (!existsSync(planPath)) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nYou are trying to execute a codebase modification or command before planning.\nUnder the matcha philosophy (enforce mode), you MUST create a plan first.\n\nAction required:\nCreate and write your 5W1H plan to .agents/matcha-plan.md using the following format:\n\n<matcha_gate>\n  <what>Describe what you are building/fixing</what>\n  <why>Why is this necessary? What is the impact?</why>\n  <how>What is the simplest and most efficient implementation path?</how>\n</matcha_gate>\n`
    };
  }

  let planContent = "";
  try {
    planContent = readFileSync(planPath, "utf-8");
  } catch {
    return null;
  }

  const matchaGateRegex = /<matcha_gate>([\s\S]*?)<\/matcha_gate>/;
  const match = planContent.match(matchaGateRegex);

  if (!match) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nThe file .agents/matcha-plan.md exists, but it does not contain a valid <matcha_gate> block.\nPlease enclose your plan in:\n\n<matcha_gate>\n  <what>...</what>\n  <why>...</why>\n  <how>...</how>\n</matcha_gate>\n`
    };
  }

  const innerContent = match[1];
  const whatMatch = innerContent.match(/<what>([\s\S]*?)<\/what>/);
  const whyMatch = innerContent.match(/<why>([\s\S]*?)<\/why>/);
  const howMatch = innerContent.match(/<how>([\s\S]*?)<\/how>/);

  const whatText = (whatMatch ? whatMatch[1] : "").trim();
  const whyText = (whyMatch ? whyMatch[1] : "").trim();
  const howText = (howMatch ? howMatch[1] : "").trim();

  const isTooShort = whatText.length < 15 || whyText.length < 15 || howText.length < 15;
  const hasPlaceholders = isTooShort || [whatText, whyText, howText].some(text =>
    text.includes("Describe what") ||
    text.includes("Why is this") ||
    text.includes("simplest and most") ||
    text === "..."
  );

  if (hasPlaceholders) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nYour 5W1H plan in .agents/matcha-plan.md is incomplete, too short (must be at least 15 characters per section), or contains placeholder text.\nPlease fill in the <what>, <why>, and <how> sections with actual project details.\n`
    };
  }

  // ── Enhanced validation (Issue #1:1 / #2:2) ───────────────────────────────
  // Skip for simple/trivial tasks (under 200 total chars = simple fix)
  const totalPlanChars = whatText.length + whyText.length + howText.length;
  if (totalPlanChars < 200) {
    // Simple task — skip enhanced validation, let it through
    return null;
  }

  // <what> must reference specific files (filename or path)
  const hasFileRef = /\.[a-z]+(:\d+)?\b/i.test(whatText) || whatText.includes("/");
  if (!hasFileRef) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nThe <what> section must reference specific files (e.g. \"Optimize sendMessage.js:120\")\nFound: \"${whatText.substring(0, 60)}...\"\n`
    };
  }

  // <why> must reference observed evidence (metrics, numbers, evidence)
  const hasEvidence = /\d+/.test(whyText) ||
    /\b(profile|benchmark|metric|observe|measured|shows|redundant|slow|N\+1)\b/i.test(whyText);
  if (!hasEvidence) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nThe <why> section must reference observed evidence (e.g. \"Profiling shows 7 redundant queries\")\nFound: \"${whyText.substring(0, 60)}...\"\n`
    };
  }

  // <how> must list 2+ concrete steps
  const stepCount = (howText.match(/(?:^|\n)\s*[-*]\s/g) || []).length;
  const numberedSteps = (howText.match(/\d+\.\s/g) || []).length;
  if (stepCount + numberedSteps < 2) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nThe <how> section must list 2+ concrete implementation steps (as a list).\n`
    };
  }

  return null;
}

export async function beforeToolUse(event, context) {
  if (process.env.MATCHA_SHIELD_OFF === "true") return null;

  const gateResult = checkPlanningGate(event);
  if (gateResult) {
    return {
      block: true,
      message: gateResult.message,
      metadata: { gate: true, convention: "matcha" }
    };
  }

  const command = parseEvent(event);
  if (!command) return null;

  const result = checkCommand(command);
  if (result) {
    return {
      block: true,
      message: result.message,
      metadata: {
        shield: true,
        convention: "matcha",
        blocked_pattern: result.blockedPattern,
      },
    };
  }

  return null;
}

export default async function handler(event, context) {
  return beforeToolUse(event, context);
}

// ─── CLI Mode — for Claude Code PreToolUse hook ────────────────────────────
const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-shield.js") ||
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-shield")
);

if (isDirectInvocation) {
  let input = "";
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    if (process.env.MATCHA_SHIELD_OFF === "true") {
      process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
      process.exit(0);
    }

    try {
      const event = JSON.parse(input);

      const gateResult = checkPlanningGate(event);
      if (gateResult) {
        process.stdout.write(JSON.stringify({
          decision: "deny",
          message: gateResult.message,
          metadata: { gate: true, convention: "matcha" },
        }) + "\n");
        process.stderr.write(gateResult.message + "\n");
        process.exit(2);
      }

      const command = parseEvent(event);
      if (!command) {
        process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
        process.exit(0);
      }

      const result = checkCommand(command);
      if (result) {
        process.stdout.write(JSON.stringify({
          decision: "deny",
          message: result.message,
          metadata: { shield: true, convention: "matcha" },
        }) + "\n");
        process.stderr.write(result.message + "\n");
        process.exit(2);
      }

      process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
      process.exit(0);
    } catch (e) {
      process.stderr.write(`matcha-shield: parse error — ${e.message}\n`);
      process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
      process.exit(0);
    }
  });
}
