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

/**
 * Programmatic API — for ESM import usage.
 * Returns { block: true, message } or null.
 */
export async function beforeToolUse(event, context) {
  if (process.env.MATCHA_SHIELD_OFF === "true") return null;
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

