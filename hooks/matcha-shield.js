/**
 * 🍵 matcha — matcha-shield.js
 * Deterministic safety gate. Blocks dangerous commands before they reach the OS.
 * Matcha-style: simple, one file, clear communication.
 *
 * Hooks into before:tool_use for Bash/ExecuteCommand tools.
 * Returns { block: true, message } for dangerous commands.
 * Returns null to allow safe commands.
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

export async function beforeToolUse(event, context) {
  // Allow override
  if (process.env.MATCHA_SHIELD_OFF === "true") return null;

  // Only check Bash/ExecuteCommand tools
  const toolName = event.tool || "";
  if (!["Bash", "ExecuteCommand", "bash", "execute_command"].includes(toolName))
    return null;

  const command = (event.input?.command || event.input?.code || "").trim();
  if (!command) return null;

  for (const danger of DANGER_PATTERNS) {
    if (danger.pattern.test(command)) {
      return {
        block: true,
        message: `🍵 matcha: shield blocked\n\nCommand: ${command}\nReason: ${danger.msg}\n\nOverride: MATCHA_SHIELD_OFF=true (not recommended)`,
        metadata: {
          shield: true,
          convention: "matcha",
          blocked_pattern: danger.pattern.source,
        },
      };
    }
  }

  return null;
}

// Default export for hooks.json compatibility
export default async function handler(event, context) {
  return beforeToolUse(event, context);
}
