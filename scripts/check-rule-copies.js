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
import { truncateCommand } from "./command-truncate.js";

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
const MODULES = ["core.md", "project.md", "modes.md", "risk.md", "engineering.md", "legacy.md"];

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
const COMMANDS = [
  "matcha:why", "matcha:review", "matcha:audit", "matcha:intensity",
  "matcha:status", "matcha:debt", "matcha:markers",
];

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

  // .claude/commands — regular file (truncated for Claude Code context window)
  // Must match the exact regeneration rule in scripts/command-truncate.js — otherwise
  // the truncated copy silently drifts from canonical.
  const claudePath = join(ROOT, `.claude/commands/${cmd}.md`);
  if (!existsSync(claudePath)) {
    console.warn(`  ⚠️  MISSING: .claude/commands/${cmd}.md`);
    allGood = false;
  } else {
    const claudeContent = readFileSync(claudePath, "utf-8").trim();
    const expected = truncateCommand(canonicalContent, cmd);
    if (claudeContent !== expected) {
      console.warn(`  ⚠️  STALE: .claude/commands/${cmd}.md (differs from regeneration rule — run build-adapters)`);
      allGood = false;
    } else {
      console.log(`  ✓  OK: .claude/commands/${cmd}.md (${claudeContent.length} chars, regen-exact)`);
    }
  }
}

// ─── .claude/agents (Claude Code format — real files, not symlinks) ────────
const AGENT_NAMES = [
  "matcha-planner",
  "matcha-finder",
  "matcha-auditor",
  "matcha-reviewer",
  "matcha-cleaner",
  "matcha-debugger",
];
console.log("\n📋 Checking .claude/agents (Claude Code format)...");
for (const agent of AGENT_NAMES) {
  const path = join(ROOT, `.claude/agents/${agent}.md`);
  if (!existsSync(path)) {
    console.warn(`  ⚠️  MISSING: .claude/agents/${agent}.md`);
    allGood = false;
  } else {
    const content = readFileSync(path, "utf-8");
    const hasClaudeFormat = content.includes("tools:") &&
      content.includes("disallowedTools:") &&
      !/^mode: /m.test(content) &&
      !/^permission:/m.test(content) &&
      !content.includes("mainAgent:");
    if (!hasClaudeFormat) {
      console.warn(`  ⚠️  OUTDATED: .claude/agents/${agent}.md (not Claude Code format — run build-adapters)`);
      allGood = false;
    } else {
      console.log(`  ✓  OK: .claude/agents/${agent}.md (Claude Code format)`);
    }
  }
}

// ─── AGY plugin root agents/ (real files, must match canonical) ─────────────console.log("\n📋 Checking AGY plugin root agents/...");
for (const agent of AGENT_NAMES) {
  const canonical = join(ROOT, `.agents/agents/${agent}.md`);
  const rootCopy = join(ROOT, `agents/${agent}.md`);
  if (!existsSync(canonical)) {
    console.warn(`  ⚠️  MISSING canonical: .agents/agents/${agent}.md`);
    allGood = false;
    continue;
  }
  if (!existsSync(rootCopy)) {
    console.warn(`  ⚠️  MISSING: agents/${agent}.md`);
    allGood = false;
    continue;
  }
  const cHash = hash(readFileSync(canonical, "utf-8"));
  const rHash = hash(readFileSync(rootCopy, "utf-8"));
  if (cHash !== rHash) {
    console.warn(`  ⚠️  OUTDATED: agents/${agent}.md`);
    allGood = false;
  } else {
    console.log(`  ✓  OK: agents/${agent}.md`);
  }
}

// AGY plugin rules/ (must match .agents/rules/matcha.md)
const rulesCanonical = join(ROOT, ".agents/rules/matcha.md");
const rulesCopy = join(ROOT, "rules/matcha.md");
if (!existsSync(rulesCanonical) || !existsSync(rulesCopy)) {
  console.warn("  ⚠️  MISSING: rules/matcha.md or .agents/rules/matcha.md");
  allGood = false;
} else if (hash(readFileSync(rulesCanonical, "utf-8")) !== hash(readFileSync(rulesCopy, "utf-8"))) {
  console.warn("  ⚠️  OUTDATED: rules/matcha.md (differs from .agents/rules/matcha.md)");
  allGood = false;
} else {
  console.log("  ✓  OK: rules/matcha.md (AGY plugin rules)");
}

// Static provider rules copies (installed by install.sh, NOT generated by build-adapters —
// they must be synced manually. Guard against drift from .agents/rules/matcha.md.)
const STATIC_RULES_COPIES = [
  ".clinerules/matcha.md",
  ".windsurf/rules/matcha.md",
  ".qoder/rules/matcha.md",
  ".roo/rules/matcha.md",
  ".trae/rules/matcha.md",
  ".github/copilot-instructions.md",
];
for (const copyPath of STATIC_RULES_COPIES) {
  const fullPath = join(ROOT, copyPath);
  if (!existsSync(fullPath)) {
    console.warn(`  ⚠️  MISSING: ${copyPath}`);
    allGood = false;
  } else if (hash(readFileSync(fullPath, "utf-8")) !== hash(readFileSync(rulesCanonical, "utf-8"))) {
    console.warn(`  ⚠️  OUTDATED: ${copyPath} (differs from .agents/rules/matcha.md)`);
    allGood = false;
  } else {
    console.log(`  ✓  OK: ${copyPath}`);
  }
}

// .cursor/rules/matcha.mdc — same content but with YAML frontmatter prepended
// (Cursor rules format). Compare body only (strip frontmatter).
const cursorPath = join(ROOT, ".cursor/rules/matcha.mdc");
if (!existsSync(cursorPath)) {
  console.warn("  ⚠️  MISSING: .cursor/rules/matcha.mdc");
  allGood = false;
} else {
  const cursorContent = readFileSync(cursorPath, "utf-8");
  const body = cursorContent.replace(/^---\n[\s\S]*?\n---\s*/, "").trim();
  const canonical = readFileSync(rulesCanonical, "utf-8").trim();
  if (body !== canonical) {
    console.warn("  ⚠️  OUTDATED: .cursor/rules/matcha.mdc (body differs from .agents/rules/matcha.md)");
    allGood = false;
  } else {
    console.log("  ✓  OK: .cursor/rules/matcha.mdc (body matches, frontmatter preserved)");
  }
}

// AGY plugin mcp_config.json
const agyMcp = join(ROOT, "mcp_config.json");
if (!existsSync(agyMcp)) {
  console.warn("  ⚠️  MISSING: mcp_config.json");
  allGood = false;
} else {
  try {
    const parsed = JSON.parse(readFileSync(agyMcp, "utf-8"));
    if (!parsed.mcpServers?.matcha) {
      console.warn("  ⚠️  mcp_config.json missing matcha mcpServers entry");
      allGood = false;
    } else {
      console.log("  ✓  OK: mcp_config.json (matcha MCP server)");
    }
  } catch (e) {
    console.warn(`  ⚠️  INVALID JSON: mcp_config.json — ${e.message}`);
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
