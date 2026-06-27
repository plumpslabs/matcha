import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const MATCHA_TEMPLATE = `# 🍵 matcha — Engineering Convention

Simple. Efficient. Deliberate. Never twice.

## Core Rules
- One function = one thing. No monolithic functions.
- No hardcoded values. Use named constants (APPNAME_VAR_NAME).
- Explicit error messages. Don't silently swallow errors.
- Prefer const over let, arrow functions, concise expressions.
- Remove temp/debug code before finishing.
- No unnecessary abstractions. Don't build what you don't need.

## Before Writing
1. **Purpose**: What am I solving? Why?
2. **Simplicity**: Is there a simpler path? Fewer functions? Fewer lines?
3. **Reuse**: Can I use an existing approach instead of inventing a new one?

## Intensity: enforce
`;

export function injectMatchaRules(dir) {
  const claudeDir = join(dir, ".claude");
  mkdirSync(claudeDir, { recursive: true });
  writeFileSync(join(claudeDir, "CLAUDE.md"), MATCHA_TEMPLATE, "utf-8");
}
