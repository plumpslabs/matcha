import { execSync } from "child_process";
import { cpSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export function countLOC(code) {
  return code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//")).length;
}

export function estimateTokens(code) {
  return Math.ceil(code.length / 4);
}

export function checkTool(name) {
  try {
    execSync(`which ${name} 2>/dev/null || where ${name} 2>nul`, { stdio: "pipe", timeout: 5000, encoding: "utf-8" });
    return true;
  } catch { return false; }
}

/**
 * Injects the full matcha convention into a target directory.
 * Copies the complete .claude/ folder (settings.json + skills + agents)
 * and the hooks/ directory so hooks (shield, post-write, stop) are available.
 * This replaces the old behavior that only wrote a minimal CLAUDE.md template.
 */
export function injectMatchaRules(dir) {
  const srcClaude = join(ROOT, ".claude");
  const srcHooks = join(ROOT, "hooks");
  const dstClaude = join(dir, ".claude");
  const dstHooks = join(dir, "hooks");

  // Copy .claude/ folder (settings.json, skills, agents)
  if (existsSync(srcClaude)) {
    cpSync(srcClaude, dstClaude, { recursive: true, force: true });
  }

  // Copy hooks/ folder (shield.js, post-write.js, stop.js, etc.)
  if (existsSync(srcHooks)) {
    cpSync(srcHooks, dstHooks, { recursive: true, force: true });
  }
}
