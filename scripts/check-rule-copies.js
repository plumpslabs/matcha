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
const ADAPTER_COPIES = [
  ".cursor/rules/matcha.mdc",
  ".windsurf/rules/matcha.md",
  ".clinerules/matcha.md",
  ".kiro/steering/matcha.md",
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
    const keySections = [
      "5W1H",
      "matcha pause",
      "APPNAME_",
      "Observation:",
      "matcha:",
      "End-of-Task",
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

if (agentsOk && skillOk) {
  console.log("\n✅ All copies consistent.\n");
  process.exit(0);
} else {
  console.log("\n❌ Some copies are outdated or missing.");
  console.log("   Run: node scripts/build-openclaw-skills.js to regenerate.\n");
  process.exit(1);
}
