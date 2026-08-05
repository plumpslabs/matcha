/**
 * 🍵 matcha — danger-checks.js
 * Dangerous command detection + simple task auto-skip.
 *
 * Exports:
 *   checkCommand(command) — returns { isDangerous, message, blockedPattern } or null
 *   isSimpleTask(toolName, input) — returns true if task should skip planning gate
 */

// ─── Dangerous Command Patterns ───────────────────────────────────────────

export const DANGER_PATTERNS = [
  // Destructive filesystem
  { pattern: /^rm\s+-rf?\s+\/\s*$/, msg: "rm -rf / would destroy the system. Use specific paths." },
  { pattern: /^rm\s+-rf?\s+~\s*$/, msg: "rm -rf ~ would delete home directory. Use specific paths." },
  { pattern: /^rm\s+-rf?\s+\.\s*$/, msg: "rm -rf . would delete current directory. Use specific paths." },

  // Permissions
  { pattern: /^chmod\s+777(\s|$)/, msg: "chmod 777 opens full permissions. Use 755 for dirs, 644 for files." },

  // Disk / block devices
  { pattern: />\s+\/dev\/(sda|sdb|sdc|nvme|hd[a-z])/, msg: "Writing to block device — would corrupt the disk." },
  { pattern: /dd\s+if=.*of=\/dev\/(sda|sdb|sdc|nvme)/, msg: "dd to block device — would overwrite the disk." },
  { pattern: /^mkfs\./, msg: "mkfs formats a filesystem — destroys all data on the device." },

  // Git destructive
  { pattern: /^git\s+push\s+--force(\s|$)/, msg: "git push --force rewrites remote history. Use --force-with-lease." },
  { pattern: /^git\s+reset\s+--hard(\s|$)/, msg: "git reset --hard discards uncommitted work permanently. Run 'git stash' first to safeguard changes." },
  { pattern: /^git\s+clean\s+-[a-zA-Z]*f[a-zA-Z]*/, msg: "git clean -f permanently removes untracked files. Use 'git clean -n' (dry run) or stash files first." },

  // Production database

  { pattern: /\bdrop\s+database\b/i, msg: "DROP DATABASE is destructive. Only run on verified local/test DBs." },
  { pattern: /\btruncate\s+table\b/i, msg: "TRUNCATE deletes all rows. Use DELETE with WHERE if possible." },

  // Remote code execution
  { pattern: /^(curl|wget)\s+.*\|\s*(bash|sh)\s*$/, msg: "Piping curl/wget to shell executes remote code. Verify source first." },

  // System commands
  { pattern: /^shutdown\s/, msg: "shutdown stops the system. Did you mean to restart a service?" },
  { pattern: /^reboot\s/, msg: "reboot restarts the system. Did you mean to restart a service?" },
  { pattern: /^init\s+0\b/, msg: "init 0 halts the system." },
];

export function checkCommand(command) {
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

// ─── Simple Task Detection (Auto-Skip) ────────────────────────────────────

const SIMPLE_TASK_PATTERNS = [
  /^(cat|ls|find|grep|head|tail|wc|echo|pwd|which|env|date)\b/i,
  /^git\s+(status|log|diff|show|branch|remote|tag|add|commit|push|pull|fetch|merge|stash|checkout|restore)\b/i,
  /^(npm|npx|yarn|pnpm|bun|vitest|jest|mocha|pytest|go test|cargo test)\b/i,
  /^(npm|pnpm|yarn|bun)\s+(install|add|ci|update|remove)\b/i,
  /^(eslint|prettier|black|ruff|gofmt|rustfmt)\b/i,
  /^(npm ls|npm list|pip list|cargo tree|go list)\b/i,
  /^(mkdir|touch|cp|mv)\b/i,
];

const SIMPLE_WRITE_PATTERNS = [
  /\.(md|txt|rst)$/i,
  /\.test\.[jt]s$/i,
  /\.spec\.[jt]s$/i,
  /test_.*\.py$/i,
  /.*_test\.go$/i,
  /\.gitignore$/i,
  /\.editorconfig$/i,
  /\bcurrent\.md$/i,
  /matcha-plan\.md$/i,
  /matcha-state\.json$/i,
];

export function isSimpleTask(toolName, input) {
  if (["Bash", "ExecuteCommand", "bash", "execute_command"].includes(toolName)) {
    const cmd = (input?.command || input?.code || "").trim();
    if (!cmd) return false;
    return SIMPLE_TASK_PATTERNS.some(p => p.test(cmd));
  }

  if (["WriteFile", "EditFile", "write_to_file", "replace_file_content", "edit", "write", "patch"].includes(toolName)) {
    const targetFile = input?.path || input?.TargetFile || input?.filePath || "";
    if (!targetFile) return false;
    return SIMPLE_WRITE_PATTERNS.some(p => p.test(targetFile));
  }

  return false;
}
