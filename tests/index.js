#!/usr/bin/env node
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

// Core files
console.log("Core files:");
for (const f of ["skills/matcha/SKILL.md", "AGENTS.md", "LICENSE", "hooks/inject-rules.js",
                  "CONTRIBUTING.md", "hooks/matcha-instructions.js", "install.sh", "QUICKSTART.md",
                  ".claude-plugin/plugin.json", ".claude-plugin/marketplace.json"]) {
  test(`${f} exists`, () => assert(existsSync(join(ROOT, f)), "missing"));
}

// All 6 agents
console.log("\nAgents:");
for (const a of ["matcha-planner", "matcha-finder", "matcha-auditor", "matcha-reviewer", "matcha-cleaner", "matcha-debugger"]) {
  test(`.claude/agents/${a}.md exists`, () => assert(existsSync(join(ROOT, `.claude/agents/${a}.md`)), "missing"));
  test(`.opencode/agents/${a}.md exists`, () => assert(existsSync(join(ROOT, `.opencode/agents/${a}.md`)), "missing"));
}

// All 5 commands
console.log("\nCommands:");
for (const c of ["why", "review", "audit", "intensity", "status"]) {
  test(`commands/${c}.md exists`, () => assert(existsSync(join(ROOT, `commands/${c}.md`)), "missing"));
  test(`.claude/commands/${c}.md exists`, () => assert(existsSync(join(ROOT, `.claude/commands/${c}.md`)), "missing"));
  test(`.opencode/commands/${c}.md exists`, () => assert(existsSync(join(ROOT, `.opencode/commands/${c}.md`)), "missing"));
}

// Platform rule directories
console.log("\nPlatform rules:");
const platforms = {
  ".cursor/rules": ["matcha.mdc", "matcha-common.mdc", "matcha-go.mdc", "matcha-typescript.mdc",
                     "matcha-python.mdc", "matcha-php.mdc", "matcha-java.mdc", "matcha-react-native.mdc",
                     "matcha-react.mdc", "matcha-angular.mdc", "matcha-nextjs.mdc", "matcha-nestjs.mdc",
                     "matcha-nuxt.mdc", "matcha-tanstack.mdc", "matcha-redis.mdc", "matcha-tailwind.mdc"],
  ".agents/rules": ["matcha.md", "matcha-common.md", "matcha-go.md", "matcha-typescript.md",
                     "matcha-python.md", "matcha-php.md", "matcha-java.md", "matcha-react-native.md",
                     "matcha-react.md", "matcha-angular.md", "matcha-nextjs.md", "matcha-nestjs.md",
                     "matcha-nuxt.md", "matcha-tanstack.md", "matcha-redis.md", "matcha-tailwind.md"],
  ".kiro/steering": ["matcha.md", "dev-mode.md", "review-mode.md", "matcha-go.md", "matcha-typescript.md",
                      "matcha-python.md", "matcha-php.md", "matcha-java.md", "matcha-react-native.md",
                      "matcha-react.md", "matcha-angular.md", "matcha-nextjs.md", "matcha-nestjs.md",
                      "matcha-nuxt.md", "matcha-tanstack.md", "matcha-redis.md", "matcha-tailwind.md"],
};
for (const [dir, files] of Object.entries(platforms)) {
  for (const f of files) {
    test(`${dir}/${f} exists`, () => assert(existsSync(join(ROOT, dir, f)), "missing"));
  }
}
test(".clinerules/matcha.md exists", () => assert(existsSync(join(ROOT, ".clinerules/matcha.md")), "missing"));
test(".windsurf/rules/matcha.md exists", () => assert(existsSync(join(ROOT, ".windsurf/rules/matcha.md")), "missing"));
test(".openclaw/skills/matcha/SKILL.md exists", () => assert(existsSync(join(ROOT, ".openclaw/skills/matcha/SKILL.md")), "missing"));

// .agents/skills/ for agy support
console.log("\nAntigravity/agy:");
test(".agents/skills/matcha/SKILL.md exists", () => assert(existsSync(join(ROOT, ".agents/skills/matcha/SKILL.md")), "missing"));

// Content validation
console.log("\nContent validation:");
const skillContent = readFileSync(join(ROOT, "skills/matcha/SKILL.md"), "utf-8");
const agentsContent = readFileSync(join(ROOT, "AGENTS.md"), "utf-8");
for (const section of KEY_SECTIONS) {
  test(`SKILL.md contains "${section}"`, () => assert(skillContent.includes(section), "missing"));
  test(`AGENTS.md contains "${section}"`, () => assert(agentsContent.includes(section), "missing"));
}
test("SKILL.md has End-of-Task Suggestions", () => assert(skillContent.includes("End-of-Task Suggestions"), "missing"));

// Canonical framework rule files
console.log("\nFramework rules:");
for (const f of ["rules/typescript/react.md", "rules/typescript/nextjs.md", "rules/typescript/angular.md",
                  "rules/typescript/nestjs.md", "rules/typescript/nuxt.md", "rules/typescript/tanstack.md",
                  "rules/common/redis.md", "rules/common/tailwind.md"]) {
  test(`${f} exists`, () => assert(existsSync(join(ROOT, f)), "missing"));
}

// Rule no-any check
console.log("\nRule quality:");
const tsRules = readFileSync(join(ROOT, "rules/typescript/coding-standards.md"), "utf-8");
test("TypeScript rule bans 'any'", () => assert(/no\s*`any`/i.test(tsRules), "no `any` rule missing"));

// install.sh syntax check
console.log("\nInstaller:");
import { execSync } from "child_process";
try {
  execSync("bash -n install.sh", { cwd: ROOT });
  test("install.sh syntax valid", () => {});
} catch {
  test("install.sh syntax valid", () => { throw new Error("bash syntax error"); });
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
