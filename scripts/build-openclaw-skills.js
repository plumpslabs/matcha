#!/usr/bin/env node
/**
 * matcha — build-openclaw-skills.js
 * Regenerates all adapter copies from the source of truth.
 * Run: node scripts/build-openclaw-skills.js
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf-8");
}

function write(relPath, content) {
  const fullPath = join(ROOT, relPath);
  writeFileSync(fullPath, content, "utf-8");
  console.log(`  ✓ Written: ${relPath}`);
}

const agentsContent = read("AGENTS.md");
const skillContent = read("skills/matcha/SKILL.md");

console.log("🍵 matcha — building adapter copies...\n");

// SKILL.md copies
write(".openclaw/skills/matcha/SKILL.md", skillContent);

// AGENTS.md → adapter copies (with cursor frontmatter stripped/adapted)
const cursorContent = read(".cursor/rules/matcha.mdc");

write(".windsurf/rules/matcha.md", cursorContent);
write(".clinerules/matcha.md", cursorContent);
write(".kiro/steering/matcha.md", cursorContent);
write(".agents/rules/matcha.md", cursorContent);

// Sync CLAUDE.md from AGENTS.md (Claude Code fallback)
write("CLAUDE.md", agentsContent);

console.log("\n✅ All adapter copies rebuilt.\n");
console.log("Run `node scripts/check-rule-copies.js` to verify.\n");
