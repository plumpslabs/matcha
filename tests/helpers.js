import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");

export { readFileSync, existsSync, execSync };

/** Ensure a file exists on disk */
export function assertFile(path) {
  if (!existsSync(join(ROOT, path))) {
    throw new Error(`missing file: ${path}`);
  }
}

/** Read a file relative to project root */
export function readProjectFile(path) {
  return readFileSync(join(ROOT, path), "utf-8");
}

/** Check file content includes all given strings */
export function assertContent(path, ...expected) {
  const content = readProjectFile(path);
  for (const s of expected) {
    if (!content.includes(s)) {
      throw new Error(`"${path}" missing: "${s}"`);
    }
  }
  return content;
}

/** Check file content does NOT include given strings */
export function assertNoContent(path, ...forbidden) {
  const content = readProjectFile(path);
  for (const s of forbidden) {
    if (content.includes(s)) {
      throw new Error(`"${path}" should NOT contain: "${s}"`);
    }
  }
}

/** Check node/javascript file has valid syntax */
export function assertValidSyntax(path) {
  try {
    execSync(`node --check "${path}"`, {
      cwd: ROOT,
      stdio: "pipe",
      timeout: 10_000,
    });
  } catch {
    throw new Error(`Node syntax error in ${path}`);
  }
}

/** Check bash file has valid syntax */
export function assertBashSyntax(path) {
  try {
    execSync(`bash -n "${path}"`, {
      cwd: ROOT,
      stdio: "pipe",
      timeout: 10_000,
    });
  } catch {
    throw new Error(`Bash syntax error in ${path}`);
  }
}

/** Shield simulation — mirrors hooks/matcha-shield.js DANGER_PATTERNS */
export function simulateShield(cmd) {
  const patterns = [
    { pattern: /^rm\s+-rf?\s+\/\s*$/, msg: "rm -rf /" },
    { pattern: /^rm\s+-rf?\s+~\s*$/, msg: "rm -rf ~" },
    { pattern: /^rm\s+-rf?\s+\.\s*$/, msg: "rm -rf ." },
    { pattern: /^chmod\s+777(\s|$)/, msg: "chmod 777" },
    { pattern: />\s+\/dev\/(sda|sdb|sdc|nvme|hd[a-z])/, msg: "write to block device" },
    { pattern: /^git\s+push\s+--force(\s|$)/, msg: "git push --force" },
    { pattern: /\bdrop\s+database\b/i, msg: "DROP DATABASE" },
    { pattern: /\btruncate\s+table\b/i, msg: "TRUNCATE TABLE" },
    { pattern: /^(curl|wget)\s+.*\|\s*(bash|sh)\s*$/, msg: "curl | bash" },
    { pattern: /^shutdown\s/, msg: "shutdown" },
    { pattern: /^reboot\s/, msg: "reboot" },
    { pattern: /^mkfs\./, msg: "mkfs" },
    { pattern: /^init\s+0\b/, msg: "init 0" },
  ];
  for (const d of patterns) {
    if (d.pattern.test(cmd)) return d.msg;
  }
  return null;
}

/** Expected critical sections in SKILL.md / AGENTS.md */
export const KEY_SECTIONS = ["5W1H", "matcha pause", "APPNAME_", "🍵 matcha"];

/** All 6 matcha agent names */
export const AGENT_NAMES = [
  "matcha-planner", "matcha-finder", "matcha-auditor",
  "matcha-reviewer", "matcha-cleaner", "matcha-debugger",
];

/** All 5 matcha commands */
export const COMMAND_NAMES = ["why", "review", "audit", "intensity", "status"];

/** All 7 benchmark tasks */
export const TASK_IDS = [
  "email-validator", "debounce", "csv-sum", "fizzbuzz",
  "array-flatten", "date-fmt", "log-filter",
  "palindrome-checker", "anagram-group", "deep-merge", "retry-async",
  "throttle", "deep-clone", "semver-compare", "config-parser",
  "memoize", "chunk-array", "unique-filter", "deep-get", "pipe-compose",
];

/** Platform dirs and their expected rule files */
export const PLATFORM_RULES = {
  ".cursor/rules": [
    "matcha-core.mdc", "matcha-cleanup.mdc", "matcha-audit.mdc", "matcha-review.mdc",
    "matcha-common.mdc", "matcha-go.mdc", "matcha-typescript.mdc",
    "matcha-python.mdc", "matcha-php.mdc", "matcha-java.mdc", "matcha-react-native.mdc",
    "matcha-react.mdc", "matcha-angular.mdc", "matcha-nextjs.mdc", "matcha-nestjs.mdc",
    "matcha-nuxt.mdc", "matcha-tanstack.mdc", "matcha-redis.mdc", "matcha-tailwind.mdc",
  ],
  ".agents/rules": [
    "matcha.md", "matcha-common.md", "matcha-go.md", "matcha-typescript.md",
    "matcha-python.md", "matcha-php.md", "matcha-java.md", "matcha-react-native.md",
    "matcha-react.md", "matcha-angular.md", "matcha-nextjs.md", "matcha-nestjs.md",
    "matcha-nuxt.md", "matcha-tanstack.md", "matcha-redis.md", "matcha-tailwind.md",
  ],
  ".kiro/steering": [
    "matcha.md", "dev-mode.md", "review-mode.md", "matcha-go.md", "matcha-typescript.md",
    "matcha-python.md", "matcha-php.md", "matcha-java.md", "matcha-react-native.md",
    "matcha-react.md", "matcha-angular.md", "matcha-nextjs.md", "matcha-nestjs.md",
    "matcha-nuxt.md", "matcha-tanstack.md", "matcha-redis.md", "matcha-tailwind.md",
  ],
};
