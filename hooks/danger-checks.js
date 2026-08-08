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
  /^git\s+(status|log|diff|show|branch|remote|tag|add|commit|push|pull|fetch|merge|stash|checkout|restore|switch|blame|bisect|reflog|describe|worktree)\b/i,
  /^(npm|npx|yarn|pnpm|bun|vitest|jest|mocha|pytest|go test|cargo test)\b/i,
  /^(npm|pnpm|yarn|bun)\s+(install|add|ci|update|remove)\b/i,
  /^(eslint|prettier|black|ruff|gofmt|rustfmt)\b/i,
  /^(npm ls|npm list|pip list|cargo tree|go list)\b/i,
  /^(mkdir|touch|cp|mv)\b/i,
];

const SIMPLE_WRITE_PATTERNS = [
  // Docs & text
  /\.(md|txt|rst)$/i,
  // Test files
  /\.test\.[jt]s$/i,
  /\.spec\.[jt]s$/i,
  /test_.*\.py$/i,
  /.*_test\.go$/i,
  // Config / low-risk data files (Proportionality: trivial edits skip the gate)
  // NOTE: dependency manifests (package.json, Cargo.toml, go.mod, Gemfile,
  // pyproject.toml, requirements.txt, composer.json) are deliberately EXCLUDED —
  // adding/changing a dependency is not a trivial edit. Component source files
  // (.vue/.svelte/.astro) are excluded too — they contain <script> logic.
  /\.(jsonc|yaml|yml|toml|ini|cfg|conf|properties)$/i,
  /\.(css|scss|sass|less|html|htm)$/i,
  /\.env(\.[a-zA-Z0-9_-]+)?$/i,
  /\.(lock|gitignore|editorconfig|prettierrc|eslintrc|babelrc|npmrc|nvmrc|tool-versions)$/i,
  /\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$/i,
  /\b(tsconfig.*\.json|jsconfig.*\.json|Dockerfile|Makefile|Vagrantfile|docker-compose.*\.ya?ml)$/i,
  // matcha session files
  /\bcurrent\.md$/i,
  /matcha-plan\.md$/i,
  /matcha-state\.json$/i,
];

// Dependency manifests are NEVER simple — adding/removing a dependency changes
// the dependency tree (supply chain + build). These override the generic
// config patterns above (e.g. pyproject.toml matches \.toml$).
const DEPENDENCY_MANIFESTS = [
  /\bpackage\.json$/i,
  /\bcomposer\.json$/i,
  /\bCargo\.toml$/i,
  /\bgo\.mod$/i,
  /\bGemfile$/i,
  /\bpyproject\.toml$/i,
  /\breq.*\.txt$/i,
  /\bbuild\.gradle(\.kts)?$/i,
  /\bpom\.xml$/i,
];

// Edit-size threshold: an edit that touches ≤ EDIT_SIZE_LIMIT lines of an existing
// source file is a *small* change (Proportionality: Small = 1-3 files, contained
// logic → short plan + L1, no full gate). Benchmark-proven: the full gate on small
// source edits cost matcha +33% tokens / +70% wall time with zero correctness gain.
export const EDIT_SIZE_LIMIT = 30;

function countLines(value) {
  if (!value) return 0;
  return String(value).split("\n").length;
}

/**
 * Estimate the size of a write/edit from its payload. Returns the number of
 * lines the change will introduce/alter, or 0 when the payload is not inspectable
 * (unknown size → NOT simple, keep the gate).
 *
 * Only string-typed payloads are counted: `input.data` on some providers is a
 * structured object, and String({...}) → "[object Object]" would fake a 1-line
 * edit and false-positive the fast pass. A non-string payload is "unknown".
 */
export function estimateEditSize(toolName, input) {
  for (const key of ["content", "newString", "fileContent"]) {
    const v = input?.[key];
    if (typeof v === "string" && v.trim()) return countLines(v);
  }
  // Some providers send edits as arrays of hunks (multi_replace, batch_file_writer)
  const files = input?.files;
  if (Array.isArray(files)) {
    return files.reduce((sum, f) => {
      const v = typeof f?.content === "string" ? f.content : f?.newString;
      return sum + (typeof v === "string" ? countLines(v) : 0);
    }, 0);
  }
  return 0; // not inspectable
}

export function isSimpleTask(toolName, input) {
  if (["Bash", "ExecuteCommand", "bash", "execute_command"].includes(toolName)) {
    const cmd = (input?.command || input?.code || "").trim();
    if (!cmd) return false;
    return SIMPLE_TASK_PATTERNS.some(p => p.test(cmd));
  }

  if (["WriteFile", "EditFile", "write_to_file", "replace_file_content", "edit", "write", "patch"].includes(toolName)) {
    const targetFile = input?.path || input?.TargetFile || input?.filePath || "";
    if (!targetFile) return false;
    if (DEPENDENCY_MANIFESTS.some(p => p.test(targetFile))) return false;
    // Component SFCs contain <script> logic — a small edit is still a logic change.
    // Keep them gated (same rationale as the manifest exclusion).
    if (/\b.*\.(vue|svelte|astro)$/i.test(targetFile)) return false;

    // Small edit to an existing source file → fast pass (Proportionality Small).
    // e.g. add a guard clause, fix a typo, rename a variable: ≤ EDIT_SIZE_LIMIT lines.
    const size = estimateEditSize(toolName, input);
    if (size > 0 && size <= EDIT_SIZE_LIMIT) return true;

    return SIMPLE_WRITE_PATTERNS.some(p => p.test(targetFile));
  }

  return false;
}
