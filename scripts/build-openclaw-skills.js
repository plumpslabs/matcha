#!/usr/bin/env node
/**
 * matcha — build-openclaw-skills.js
 * Regenerates all adapter copies from the source of truth.
 * Run: node scripts/build-openclaw-skills.js
 */

import { readFileSync, writeFileSync, rmSync, symlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf-8");
}

function write(relPath, content) {
  writeFileSync(join(ROOT, relPath), content, "utf-8");
  console.log(`  ✓ Written: ${relPath}`);
}

const skillContent = read("skills/matcha/SKILL.md");

console.log("🍵 matcha — building adapter copies...\n");

// SKILL.md copies
write(".openclaw/skills/matcha/SKILL.md", skillContent);
write(".agents/skills/matcha/SKILL.md", skillContent);

// Agents — sync from .agents/ (canonical) to .opencode/ + .claude/
console.log("");
for (const a of ["matcha-planner", "matcha-finder", "matcha-auditor", "matcha-reviewer", "matcha-cleaner", "matcha-debugger"]) {
  write(`.agents/agents/${a}.md`, read(`.claude/agents/${a}.md`));
}

// Commands — symlink for Claude Code (with size check), file for .agents/
const SYMLINK_MAX = 1000; // safe limit (actual ~1024 on macOS)
for (const c of ["why", "review", "audit", "intensity", "status", "debt", "stats", "markers"]) {
  const content = read(`commands/${c}.md`);
  const claudePath = join(ROOT, `.claude/commands/${c}.md`);
  const agentsPath = join(ROOT, `.agents/commands/${c}.md`);

  try { rmSync(claudePath); } catch {}

  const trimmed = content.trim();
  if (trimmed.length <= SYMLINK_MAX) {
    symlinkSync(trimmed, claudePath);
    console.log(`  ✓ Symlink: .claude/commands/${c}.md (${trimmed.length}B)`);
  } else {
    // Truncate for symlink — first 900 chars + pointer to canonical
    const truncated = trimmed.substring(0, 900) + "\n...\nSee commands/" + c + ".md for full";
    symlinkSync(truncated, claudePath);
    console.log(`  ⚠ Truncated symlink: .claude/commands/${c}.md (${truncated.length}B from ${trimmed.length}B)`);
  }

  write(`.agents/commands/${c}.md`, content);
}

console.log("  → Synced commands: why, review, audit, intensity, status, debt × Claude (symlink) + .agents (file)");
console.log("\n✅ All adapter copies rebuilt.\n");
