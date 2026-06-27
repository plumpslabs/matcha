#!/usr/bin/env node
/**
 * matcha — check-rule-copies.js
 * Validates that all adapter copies of the ruleset match the source of truth.
 * Run: node scripts/check-rule-copies.js
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SOURCE = join(ROOT, "AGENTS.md");

// These files should be kept in sync with AGENTS.md content
// NOTE: .kiro/steering/matcha.md is excluded — Kiro uses its own format
// (inclusion modes) which differs from Cursor's alwaysApply/globs.
const ADAPTER_COPIES = [
  ".cursor/rules/matcha-core.mdc",
  ".windsurf/rules/matcha.md",
  ".clinerules/matcha.md",
  ".agents/rules/matcha.md",
];

// SKILL.md copies
const SKILL_SOURCE = join(ROOT, "skills/matcha/SKILL.md");
const SKILL_COPIES = [
  ".openclaw/skills/matcha/SKILL.md",
];

function hash(content) {
  return createHash("md5").update(content).digest("hex");
}

function checkCopies(sourceFile, copies, label) {
  if (!existsSync(sourceFile)) {
    console.error(`❌ Source not found: ${sourceFile}`);
    process.exit(1);
  }

  const sourceContent = readFileSync(sourceFile, "utf-8");
  // For adapter copies, we check if they contain all key sections from source
  // (adapters may have frontmatter that source doesn't)
  const sourceLines = sourceContent.split("\n").filter(l => l.trim()).length;

  console.log(`\n📋 Checking ${label} copies...`);
  let allGood = true;

  for (const copyPath of copies) {
    const fullPath = join(ROOT, copyPath);
    if (!existsSync(fullPath)) {
      console.warn(`  ⚠️  MISSING: ${copyPath}`);
      allGood = false;
      continue;
    }

    const copyContent = readFileSync(fullPath, "utf-8");
    const copyLines = copyContent.split("\n").filter(l => l.trim()).length;

    // Simple heuristic: check key sections exist
    // These are the sections present in all adapter copies.
    // Note: scoped files (matcha-core.mdc) don't have full AGENTS.md content,
    // so we check sections that exist across all adapter formats.
    const keySections = [
      "5W1H",
      "APPNAME_",
      "Never twice",
      "Cleanup",
      "Intensity",
    ];

    const missingSections = keySections.filter(s => !copyContent.includes(s));

    if (missingSections.length > 0) {
      console.warn(`  ⚠️  OUTDATED: ${copyPath}`);
      console.warn(`     Missing sections: ${missingSections.join(", ")}`);
      allGood = false;
    } else {
      console.log(`  ✓  OK: ${copyPath}`);
    }
  }

  return allGood;
}

console.log("🍵 matcha — rule copy checker\n");

const agentsOk = checkCopies(SOURCE, ADAPTER_COPIES, "AGENTS.md");
const skillOk = checkCopies(SKILL_SOURCE, SKILL_COPIES, "SKILL.md");

// ─── Command files check ─────────────────────────────────────────────────────
console.log("\n📋 Checking command file copies...");
const COMMANDS = ["why", "review", "audit", "intensity", "status"];
const COMMAND_PLATFORMS = [".claude/commands", ".agents/commands"];
let commandsOk = true;

for (const cmd of COMMANDS) {
  const canonicalPath = join(ROOT, `commands/${cmd}.md`);
  if (!existsSync(canonicalPath)) {
    console.warn(`  ⚠️  MISSING canonical: commands/${cmd}.md`);
    commandsOk = false;
    continue;
  }
  const canonicalContent = readFileSync(canonicalPath, "utf-8");
  const canonicalHash = hash(canonicalContent);

  for (const platform of COMMAND_PLATFORMS) {
    const copyPath = join(ROOT, `${platform}/${cmd}.md`);
    if (!existsSync(copyPath)) {
      console.warn(`  ⚠️  MISSING: ${platform}/${cmd}.md`);
      commandsOk = false;
      continue;
    }
    const copyContent = readFileSync(copyPath, "utf-8");
    if (hash(copyContent) !== canonicalHash) {
      console.warn(`  ⚠️  OUTDATED: ${platform}/${cmd}.md`);
      commandsOk = false;
    } else {
      console.log(`  ✓  OK: ${platform}/${cmd}.md`);
    }
  }
}

if (agentsOk && skillOk && commandsOk) {
  console.log("\n✅ All copies consistent.\n");
  process.exit(0);
} else {
  console.log("\n❌ Some copies are outdated or missing.");
  console.log("   Run: node scripts/build-openclaw-skills.js to regenerate.\n");
  process.exit(1);
}
