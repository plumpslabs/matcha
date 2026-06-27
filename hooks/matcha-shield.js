/**
 * 🍵 matcha — matcha-shield.js
 * Deterministic safety gate. Blocks dangerous commands before they reach the OS.
 * Matcha-style: simple, one file, clear communication.
 *
 * Dual-mode:
 *   1. CLI mode (used by Claude Code PreToolUse hook):
 *      Reads event JSON from stdin, exits with code 2 to block.
 *   2. Programmatic mode (ESM export):
 *      Returns { block, message } for dangerous commands.
 *
 * Override with env: MATCHA_SHIELD_OFF=true
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

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

/**
 * Check a command against danger patterns.
 * Returns { isDangerous, message } or null if safe.
 */
function checkCommand(command) {
  if (!command) return null;
  for (const danger of DANGER_PATTERNS) {
    if (danger.pattern.test(command)) {
      return {
        isDangerous: true,
        message: `🍵 matcha: shield blocked

Command: ${command}
Reason: ${danger.msg}

Override: MATCHA_SHIELD_OFF=true`,
        blockedPattern: danger.pattern.source,
      };
    }
  }
  return null;
}

/**
 * Parse tool name and command from a Claude Code hook event.
 */
function parseEvent(event) {
  if (!event) return null;
  const toolName = event.tool || event.toolName || "";
  if (!["Bash", "ExecuteCommand", "bash", "execute_command"].includes(toolName))
    return null;
  return (event.input?.command || event.input?.code || "").trim() || null;
}

export function checkPlanningGate(event) {
  if (!event) return null;

  // 1. Check if intensity is observe (non-blocking)
  let intensity = "enforce";
  try {
    const statePath = join(ROOT, ".agents/matcha-state.json");
    if (existsSync(statePath)) {
      const state = JSON.parse(readFileSync(statePath, "utf-8"));
      if (state.intensity) intensity = state.intensity;
    }
  } catch {}

  if (intensity === "observe") {
    return null; // non-blocking
  }

  // 2. Check if the tool is a modification/execution tool
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

  if (!isWriteTool && !isCommandTool) {
    return null; // Allow other tools (Read, Grep, etc.)
  }

  // 3. For write tools, check if writing to the plan/state files
  if (isWriteTool) {
    const targetFile = input.path || input.TargetFile || input.filePath || "";
    const files = input.files || [];
    const isWritingPlan = targetFile.endsWith("matcha-plan.md") || 
                          targetFile.endsWith("matcha-state.json") ||
                          files.some(f => f.path?.endsWith("matcha-plan.md") || f.path?.endsWith("matcha-state.json"));
    if (isWritingPlan) {
      return null; // Always allow writing to the plan/state files
    }
  }

  // 4. For command tools, check if it's a safe diagnostic command
  if (isCommandTool) {
    const cmd = (input.command || input.code || "").trim();
    // Allow safe diagnostic or local testing commands
    const isSafe = /^(git status|git diff|npm test|vitest|find |ls |cat |grep |agy status)/i.test(cmd);
    if (isSafe) {
      return null; // Allow diagnostic commands
    }
  }

  // 5. Verify if the 5W1H plan exists and is valid
  const planPath = join(ROOT, ".agents/matcha-plan.md");
  if (!existsSync(planPath)) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked

You are trying to execute a codebase modification or command before planning.
Under the matcha philosophy (enforce mode), you MUST create a plan first.

Action required:
Create and write your 5W1H plan to .agents/matcha-plan.md using the following format:

<matcha_gate>
  <what>Describe what you are building/fixing</what>
  <why>Why is this necessary? What is the impact?</why>
  <how>What is the simplest and most efficient implementation path?</how>
</matcha_gate>
`
    };
  }

  let planContent = "";
  try {
    planContent = readFileSync(planPath, "utf-8");
  } catch {
    return null; // fail open if read error
  }

  // Parse XML tags using regex
  const matchaGateRegex = /<matcha_gate>([\s\S]*?)<\/matcha_gate>/;
  const match = planContent.match(matchaGateRegex);

  if (!match) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked

The file .agents/matcha-plan.md exists, but it does not contain a valid <matcha_gate> block.
Please enclose your plan in:

<matcha_gate>
  <what>...</what>
  <why>...</why>
  <how>...</how>
</matcha_gate>
`
    };
  }

  const innerContent = match[1];
  const whatMatch = innerContent.match(/<what>([\s\S]*?)<\/what>/);
  const whyMatch = innerContent.match(/<why>([\s\S]*?)<\/why>/);
  const howMatch = innerContent.match(/<how>([\s\S]*?)<\/how>/);

  const whatText = (whatMatch ? whatMatch[1] : "").trim();
  const whyText = (whyMatch ? whyMatch[1] : "").trim();
  const howText = (howMatch ? howMatch[1] : "").trim();

  // Ensure each tag has a minimum length (e.g. 15 characters) to prevent lazy/empty answers
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
      message: `🍵 matcha: Planning Gate Blocked

Your 5W1H plan in .agents/matcha-plan.md is incomplete, too short (must be at least 15 characters per section), or contains placeholder text.
Please fill in the <what>, <why>, and <how> sections with actual project details.
`
    };
  }

  return null; // Gate passed successfully!
}

/**
 * Programmatic API — for ESM import usage.
 * Returns { block: true, message } or null.
 */
export async function beforeToolUse(event, context) {
  if (process.env.MATCHA_SHIELD_OFF === "true") return null;

  // 1. Check Planning Gate
  const gateResult = checkPlanningGate(event);
  if (gateResult) {
    return {
      block: true,
      message: gateResult.message,
      metadata: {
        gate: true,
        convention: "matcha"
      }
    };
  }

  // 2. Check dangerous commands (original shield logic)
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

// Default export for hooks.json compatibility
export default async function handler(event, context) {
  return beforeToolUse(event, context);
}

// ─── CLI Mode — for Claude Code PreToolUse hook ────────────────────────────
// When invoked as: node hooks/matcha-shield.js
// Reads event JSON from stdin, exits with code 2 to block dangerous commands.
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

      // 1. Check Planning Gate
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

      // 2. Check dangerous commands
      const command = parseEvent(event);
      if (!command) {
        // Not a Bash tool — allow
        process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
        process.exit(0);
      }

      const result = checkCommand(command);
      if (result) {
        // Block: exit code 2 + deny decision + clear message to stderr
        process.stdout.write(JSON.stringify({
          decision: "deny",
          message: result.message,
          metadata: { shield: true, convention: "matcha" },
        }) + "\n");
        process.stderr.write(result.message + "\n");
        process.exit(2);
      }

      // Safe — allow
      process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
      process.exit(0);
    } catch (e) {
      // If parse fails, allow (fail open) and log
      process.stderr.write(`matcha-shield: parse error — ${e.message}\n`);
      process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
      process.exit(0);
    }
  });
}

