#!/usr/bin/env node
/**
 * matcha CLI
 * Usage:
 *   npx matcha-convention install     — copy files to current project
 *   npx matcha-convention check       — validate adapter copies
 *   npx matcha-convention help        — show this
 */

import { execSync } from "child_process";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const CWD = process.cwd();

const ADAPTERS = [
  { src: "AGENTS.md", dest: "AGENTS.md" },
  { src: "CLAUDE.md", dest: "CLAUDE.md" },
  { src: ".cursor/rules/matcha.mdc", dest: ".cursor/rules/matcha.mdc", mkdir: ".cursor/rules" },
  { src: ".windsurf/rules/matcha.md", dest: ".windsurf/rules/matcha.md", mkdir: ".windsurf/rules" },
  { src: ".clinerules/matcha.md", dest: ".clinerules/matcha.md", mkdir: ".clinerules" },
  { src: ".kiro/steering/matcha.md", dest: ".kiro/steering/matcha.md", mkdir: ".kiro/steering" },
  { src: ".agents/rules/matcha.md", dest: ".agents/rules/matcha.md", mkdir: ".agents/rules" },
  { src: "gemini-extension.json", dest: "gemini-extension.json" },
  { src: ".claude-plugin/plugin.json", dest: ".claude-plugin/plugin.json", mkdir: ".claude-plugin" },
];

const cmd = process.argv[2];

if (cmd === "install") {
  console.log("🍵 matcha — installing to current project...\n");
  for (const adapter of ADAPTERS) {
    if (adapter.mkdir) {
      mkdirSync(join(CWD, adapter.mkdir), { recursive: true });
    }
    try {
      copyFileSync(join(PKG_ROOT, adapter.src), join(CWD, adapter.dest));
      console.log(`  ✓ ${adapter.dest}`);
    } catch (e) {
      console.warn(`  ⚠ skipped ${adapter.dest}: ${e.message}`);
    }
  }
  console.log("\n✅ matcha installed. Commit these files to your repo.\n");
  console.log("Tip: for Claude Code, add via /plugin install or UI > Customize > plugins");

} else if (cmd === "check") {
  execSync("node " + join(PKG_ROOT, "scripts/check-rule-copies.js"), { stdio: "inherit" });

} else {
  console.log(`
🍵 matcha-convention

Usage:
  npx matcha-convention install    Copy adapter files to current project
  npx matcha-convention check      Validate all adapter copies are in sync

Claude Code:
  /plugin install https://github.com/plumpslabs/matcha-convention

Antigravity / Gemini CLI:
  agy plugin install https://github.com/plumpslabs/matcha-convention

Codex:
  codex plugin marketplace add plumpslabs/matcha-convention

OpenCode (opencode.json):
  { "plugin": ["matcha-convention"] }

More: https://github.com/plumpslabs/matcha-convention
`);
}
