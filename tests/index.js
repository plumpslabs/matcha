#!/usr/bin/env node
/**
 * matcha — tests/index.js
 * Basic validation: all adapter files exist and contain key sections.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

const KEY_SECTIONS = ["5W1H", "matcha pause", "APPNAME_", "Observation:", "🍵 matcha"];

console.log("\n🍵 matcha test suite\n");

// Core files exist
console.log("Core files:");
test("skills/matcha/SKILL.md exists", () => {
  assert(existsSync(join(ROOT, "skills/matcha/SKILL.md")), "missing");
});
test("AGENTS.md exists", () => {
  assert(existsSync(join(ROOT, "AGENTS.md")), "missing");
});
test("LICENSE exists", () => {
  assert(existsSync(join(ROOT, "LICENSE")), "missing");
});
test("hooks/inject-rules.js exists", () => {
  assert(existsSync(join(ROOT, "hooks/inject-rules.js")), "missing");
});
test("CONTRIBUTING.md exists", () => {
  assert(existsSync(join(ROOT, "CONTRIBUTING.md")), "missing");
});
test("hooks/matcha-instructions.js exists", () => {
  assert(existsSync(join(ROOT, "hooks/matcha-instructions.js")), "missing");
});

// Adapter files exist
console.log("\nAdapters:");
const adapters = [
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".cursor/rules/matcha.mdc",
  ".windsurf/rules/matcha.md",
  ".clinerules/matcha.md",
  ".kiro/steering/matcha.md",
  ".agents/rules/matcha.md",
  ".openclaw/skills/matcha/SKILL.md",
  ".opencode/plugins/matcha.mjs",
  "gemini-extension.json",
  "bin/matcha.js",
  "CLAUDE.md",
];
for (const a of adapters) {
  test(`${a} exists`, () => assert(existsSync(join(ROOT, a)), "missing"));
}

// Key sections present in skill and agents
console.log("\nContent validation:");
const skillContent = readFileSync(join(ROOT, "skills/matcha/SKILL.md"), "utf-8");
const agentsContent = readFileSync(join(ROOT, "AGENTS.md"), "utf-8");
const cursorContent = readFileSync(join(ROOT, ".cursor/rules/matcha.mdc"), "utf-8");

for (const section of KEY_SECTIONS) {
  test(`SKILL.md contains "${section}"`, () => assert(skillContent.includes(section), "missing section"));
  test(`AGENTS.md contains "${section}"`, () => assert(agentsContent.includes(section), "missing section"));
}

// Snarky suggestions section in SKILL.md
test("SKILL.md has snarky suggestions section", () => {
  assert(skillContent.includes("End-of-Task Suggestions"), "missing suggestions section");
});

// CLAUDE.md content validation (existence already covered by adapter loop above)
test("CLAUDE.md has snarky suggestions", () => {
  const content = readFileSync(join(ROOT, "CLAUDE.md"), "utf-8");
  assert(content.includes("End-of-Task Suggestions"), "missing suggestions section");
  assert(content.includes("5W1H"), "missing 5W1H");
  assert(content.includes("APPNAME_"), "missing APPNAME_");
});

// Commands exist
console.log("\nCommands:");
for (const cmd of ["why", "audit", "review"]) {
  test(`commands/${cmd}.md exists`, () => {
    assert(existsSync(join(ROOT, `commands/${cmd}.md`)), "missing");
  });
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
