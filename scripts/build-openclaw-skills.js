#!/usr/bin/env node
/**
 * matcha — build-openclaw-skills.js
 * Regenerates all adapter copies from the source of truth.
 * Run: node scripts/build-openclaw-skills.js
 */

import { readFileSync, writeFileSync, mkdirSync, symlinkSync, rmSync } from "fs";
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

const skillContent = read("skills/matcha/SKILL.md");

console.log("🍵 matcha — building adapter copies...\n");

// SKILL.md copies
write(".openclaw/skills/matcha/SKILL.md", skillContent);
write(".agents/skills/matcha/SKILL.md", skillContent);

// matcha-core.mdc → platform adapter copies (core rules for Windsurf, Cline, .agents)
const coreContent = read(".cursor/rules/matcha-core.mdc");

write(".windsurf/rules/matcha.md", coreContent);
write(".clinerules/matcha.md", coreContent);
write(".agents/rules/matcha.md", coreContent);

// NOTE: .kiro/steering/matcha.md is NOT synced from cursor — Kiro uses
// its own format (inclusion modes) which differs from Cursor's alwaysApply/globs.
// Kiro steering files are maintained independently.

// Agents — sync from .agents/ (canonical) to .opencode/ (format) + .claude/ (symlink)
console.log("");
for (const a of ["matcha-planner", "matcha-finder", "matcha-auditor", "matcha-reviewer", "matcha-cleaner", "matcha-debugger"]) {
  write(`.agents/agents/${a}.md`, read(`.claude/agents/${a}.md`));
}

// Commands — sync from canonical commands/ to Claude Code + .agents
// NOTE: Claude Code uses symlinks (target = command definition).
// .agents uses regular files (universal format).
// .opencode/commands/ excluded — OpenCode plugin registers commands
// via file: field directly to canonical commands/, so directory files are dead.

for (const c of ["why", "review", "audit", "intensity", "status", "debt"]) {
  const content = read(`commands/${c}.md`);
  const claudePath = join(ROOT, `.claude/commands/${c}.md`);
  const agentsPath = join(ROOT, `.agents/commands/${c}.md`);

  // Claude: symlink with command definition as target
  try { rmSync(claudePath); } catch {}
  symlinkSync(content.trim(), claudePath);
  console.log(`  ✓ Symlink: .claude/commands/${c}.md`);

  // .agents: regular file
  write(`.agents/commands/${c}.md`, content);
}

console.log("  → Synced commands: why, review, audit, intensity, status, debt × Claude (symlink) + .agents (file)");

// Note: CLAUDE.md is intentionally kept separate from AGENTS.md
// CLAUDE.md = short Claude persona (~29 lines)
// AGENTS.md = full agent registry (~45 lines)
// Do NOT overwrite CLAUDE.md with AGENTS.md — different purposes.

// Sync Cursor scoped .mdc files to .agents/rules/ for universal access
// NOTE: matcha-core is already synced above as matcha.md — skip to avoid duplicate
console.log("");
for (const f of ["matcha-cleanup", "matcha-audit", "matcha-review"]) {
  try {
    const content = read(`.cursor/rules/${f}.mdc`);
    write(`.agents/rules/${f}.md`, content);
  } catch (e) {
    console.warn(`  ⚠️  Failed to sync ${f}: ${e.message}`);
  }
}

// Sync GEMINI.md as adapter copy
console.log("");
try {
  write(".qwen/skills/matcha/GEMINI.md", read("GEMINI.md"));
} catch {}

console.log("\n✅ All adapter copies rebuilt.\n");
console.log("Run `node scripts/check-rule-copies.js` to verify.\n");
