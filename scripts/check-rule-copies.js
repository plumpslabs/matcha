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

// SKILL.md copies
const SKILL_SOURCE = join(ROOT, "skills/matcha/SKILL.md");
const SKILL_COPIES = [
  ".openclaw/skills/matcha/SKILL.md",
  ".agents/skills/matcha/SKILL.md",
];

console.log("🍵 matcha — copy checker\n");

// ─── SKILL.md copies ─────────────────────────────────────────────────────────
let allGood = true;

console.log("📋 Checking SKILL.md copies...");
const skillSourceHash = hash(readFileSync(SKILL_SOURCE, "utf-8"));

for (const copyPath of SKILL_COPIES) {
  const fullPath = join(ROOT, copyPath);
  if (!existsSync(fullPath)) {
    console.warn(`  ⚠️  MISSING: ${copyPath}`);
    allGood = false;
    continue;
  }
  const copyHash = hash(readFileSync(fullPath, "utf-8"));
  if (copyHash !== skillSourceHash) {
    console.warn(`  ⚠️  OUTDATED: ${copyPath}`);
    allGood = false;
  } else {
    console.log(`  ✓  OK: ${copyPath}`);
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

  // .claude/commands — symlink (target = content, not file path)
  const claudePath = join(ROOT, `.claude/commands/${cmd}.md`);
  try {
    const stat = lstatSync(claudePath);
    if (!stat.isSymbolicLink()) {
      console.warn(`  ⚠️  NOT SYMLINK: .claude/commands/${cmd}.md`);
      allGood = false;
    } else {
      const symlinkTarget = readlinkSync(claudePath);
      if (hash(symlinkTarget.trim()) !== canonicalHash) {
        console.warn(`  ⚠️  OUTDATED: .claude/commands/${cmd}.md`);
        allGood = false;
      } else {
        console.log(`  ✓  OK: .claude/commands/${cmd}.md`);
      }
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
