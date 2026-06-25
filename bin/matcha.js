#!/usr/bin/env node
/**
 * matcha CLI
 * Usage:
 *   npx matcha install     — copy files to current project
 *   npx matcha check       — validate adapter copies
 *   npx matcha help        — show this
 */

import { execSync } from "child_process";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const CWD = process.cwd();

const ADAPTERS = [
  { id: "universal", src: "AGENTS.md", dest: "AGENTS.md", check: () => true },
  { id: "cursor", src: ".cursor/rules/matcha.mdc", dest: ".cursor/rules/matcha.mdc", mkdir: ".cursor/rules", check: () => existsSync(join(CWD, ".cursor")) },
  { id: "windsurf", src: ".windsurf/rules/matcha.md", dest: ".windsurf/rules/matcha.md", mkdir: ".windsurf/rules", check: () => existsSync(join(CWD, ".windsurf")) },
  { id: "cline", src: ".clinerules/matcha.md", dest: ".clinerules/matcha.md", mkdir: ".clinerules", check: () => existsSync(join(CWD, ".clinerules")) || existsSync(join(CWD, ".cline")) },
  { id: "kiro", src: ".kiro/steering/matcha.md", dest: ".kiro/steering/matcha.md", mkdir: ".kiro/steering", check: () => existsSync(join(CWD, ".kiro")) },
  { id: "agents", src: ".agents/rules/matcha.md", dest: ".agents/rules/matcha.md", mkdir: ".agents/rules", check: () => existsSync(join(CWD, ".agents")) },
  { id: "claude", src: "CLAUDE.md", dest: "CLAUDE.md", check: () => existsSync(join(CWD, "CLAUDE.md")) },
];

const cmd = process.argv[2];

if (cmd === "install") {
  console.log("🍵 matcha — auto-detecting environment...\n");
  let installedCount = 0;

  for (const adapter of ADAPTERS) {
    if (adapter.check()) {
      if (adapter.mkdir) {
        mkdirSync(join(CWD, adapter.mkdir), { recursive: true });
      }
      try {
        copyFileSync(join(PKG_ROOT, adapter.src), join(CWD, adapter.dest));
        console.log(`  ✓ Installed for ${adapter.id} -> ${adapter.dest}`);
        installedCount++;
      } catch (e) {
        console.warn(`  ⚠ skipped ${adapter.id}: ${e.message}`);
      }
    }
  }
  
  console.log(`\n✅ matcha installed ${installedCount} file(s). Commit these to your repo.\n`);
  console.log("For global CLI assistants, install manually:");
  console.log("  Claude Code: /plugin install https://github.com/plumpslabs/matcha");
  console.log("  Antigravity: agy plugin install https://github.com/plumpslabs/matcha");
  console.log("  Codex:       codex plugin marketplace add plumpslabs/matcha\n");

} else if (cmd === "check") {
  execSync("node " + join(PKG_ROOT, "scripts/check-rule-copies.js"), { stdio: "inherit" });

} else {
  console.log(`
🍵 matcha

Usage:
  npx matcha install    Copy adapter files to current project
  npx matcha check      Validate all adapter copies are in sync

Claude Code:
  /plugin install https://github.com/plumpslabs/matcha

Antigravity / Gemini CLI:
  agy plugin install https://github.com/plumpslabs/matcha

Codex:
  codex plugin marketplace add plumpslabs/matcha

OpenCode (opencode.json):
  { "plugin": ["matcha"] }

More: https://github.com/plumpslabs/matcha
`);
}
