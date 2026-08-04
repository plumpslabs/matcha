#!/usr/bin/env node
/**
 * matcha — check-rule-copies.js
 * Validates that all adapter copies match the source of truth.
 * Run: node scripts/check-rule-copies.js
 */

import { readFileSync, existsSync, lstatSync, readlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function hash(content) {
  return createHash("md5").update(content).digest("hex");
}

console.log("🍵 matcha — copy checker\n");

let allGood = true;

// ─── SKILL.md copies ─────────────────────────────────────────────────────────
console.log("📋 Checking SKILL.md copies...");
const SKILL_SOURCE = join(ROOT, "skills/matcha/SKILL.md");
const SKILL_COPIES = [
  ".openclaw/skills/matcha/SKILL.md",
  ".agents/skills/matcha/SKILL.md",
  ".claude/skills/matcha/SKILL.md",
  ".opencode/skills/matcha/SKILL.md",
];

const skillSourceHash = hash(readFileSync(SKILL_SOURCE, "utf-8"));

for (const copyPath of SKILL_COPIES) {
  const fullPath = join(ROOT, copyPath);
  if (!existsSync(fullPath)) {
    console.warn(`  ⚠️  MISSING: ${copyPath}`);
    allGood = false;
    continue;
  }
  const stat = lstatSync(fullPath);
  if (stat.isSymbolicLink()) {
    // Symlink is OK — just verify it points to the right place
    const target = readlinkSync(fullPath);
    if (!target.includes("skills/matcha/SKILL.md")) {
      console.warn(`  ⚠️  WRONG TARGET: ${copyPath} → ${target}`);
      allGood = false;
    } else {
      console.log(`  ✓  OK (symlink): ${copyPath}`);
    }
  } else {
    // Regular file — check content
    const copyHash = hash(readFileSync(fullPath, "utf-8"));
    if (copyHash !== skillSourceHash) {
      console.warn(`  ⚠️  OUTDATED: ${copyPath}`);
      allGood = false;
    } else {
      console.log(`  ✓  OK: ${copyPath}`);
    }
  }
}

// ─── Skill modules ───────────────────────────────────────────────────────────
console.log("\n📋 Checking skill modules...");
const MODULES = ["core.md", "tdd.md", "loop.md", "communication.md"];

for (const mod of MODULES) {
  const modPath = join(ROOT, `skills/matcha/modules/${mod}`);
  if (!existsSync(modPath)) {
    console.warn(`  ⚠️  MISSING: skills/matcha/modules/${mod}`);
    allGood = false;
  } else {
    const content = readFileSync(modPath, "utf-8");
    if (content.trim().length < 50) {
      console.warn(`  ⚠️  TOO SHORT: skills/matcha/modules/${mod} (${content.trim().length} chars)`);
      allGood = false;
    } else {
      console.log(`  ✓  OK: skills/matcha/modules/${mod} (${content.trim().length} chars)`);
    }
  }
}

// ─── Pattern registry ────────────────────────────────────────────────────────
console.log("\n📋 Checking pattern registry...");
const patternsPath = join(ROOT, "hooks/patterns.json");
if (!existsSync(patternsPath)) {
  console.warn("  ⚠️  MISSING: hooks/patterns.json");
  allGood = false;
} else {
  try {
    const parsed = JSON.parse(readFileSync(patternsPath, "utf-8"));
    const langCount = Object.keys(parsed.languages || {}).length;
    if (langCount < 7) {
      console.warn(`  ⚠️  Only ${langCount} languages in patterns.json (expected 7+)`);
      allGood = false;
    } else {
      console.log(`  ✓  OK: hooks/patterns.json (${langCount} languages)`);
    }
  } catch (e) {
    console.warn(`  ⚠️  INVALID JSON: hooks/patterns.json — ${e.message}`);
    allGood = false;
  }
}

// ─── MCP server ──────────────────────────────────────────────────────────────
console.log("\n📋 Checking MCP server...");
const mcpPath = join(ROOT, "hooks/matcha-mcp-server.js");
if (!existsSync(mcpPath)) {
  console.warn("  ⚠️  MISSING: hooks/matcha-mcp-server.js");
  allGood = false;
} else {
  const content = readFileSync(mcpPath, "utf-8");
  const hasTools = content.includes("matcha_shield_check") &&
                   content.includes("matcha_post_write_scan") &&
                   content.includes("matcha_stop_tips") &&
                   content.includes("matcha_plan_validate");
  if (!hasTools) {
    console.warn("  ⚠️  MCP server missing expected tools");
    allGood = false;
  } else {
    console.log("  ✓  OK: hooks/matcha-mcp-server.js (4 tools)");
  }
}

// ─── Command files ───────────────────────────────────────────────────────────
console.log("\n📋 Checking command file copies...");
const COMMANDS = ["why", "review", "audit", "intensity", "status", "debt"];

for (const cmd of COMMANDS) {
  const canonical = join(ROOT, `commands/${cmd}.md`);
  if (!existsSync(canonical)) {
    console.warn(`  ⚠️  MISSING canonical: commands/${cmd}.md`);
    allGood = false;
    continue;
  }
  const canonicalContent = readFileSync(canonical, "utf-8").trim();
  const canonicalHash = hash(canonicalContent);

  // .agents/commands — regular file
  const agentsPath = join(ROOT, `.agents/commands/${cmd}.md`);
  if (!existsSync(agentsPath)) {
    console.warn(`  ⚠️  MISSING: .agents/commands/${cmd}.md`);
    allGood = false;
  } else {
    const agentsContent = readFileSync(agentsPath, "utf-8").trim();
    if (hash(agentsContent) !== canonicalHash) {
      console.warn(`  ⚠️  OUTDATED: .agents/commands/${cmd}.md`);
      allGood = false;
    } else {
      console.log(`  ✓  OK: .agents/commands/${cmd}.md`);
    }
  }

  // .claude/commands — symlink
  const claudePath = join(ROOT, `.claude/commands/${cmd}.md`);
  try {
    const stat = lstatSync(claudePath);
    if (!stat.isSymbolicLink()) {
      console.warn(`  ⚠️  NOT SYMLINK: .claude/commands/${cmd}.md`);
      allGood = false;
    } else {
      console.log(`  ✓  OK: .claude/commands/${cmd}.md (symlink)`);
    }
  } catch {
    console.warn(`  ⚠️  MISSING: .claude/commands/${cmd}.md`);
    allGood = false;
  }
}

if (allGood) {
  console.log("\n✅ All copies consistent.\n");
  process.exit(0);
} else {
  console.log("\n❌ Some copies are outdated or missing.\n");
  process.exit(1);
}
