#!/usr/bin/env node
/**
 * 🍵 matcha CLI
 * Simple. Efficient. Deliberate. Never twice.
 *
 * Usage:
 *   npx matcha init        — Install matcha to current project
 *   npx matcha status      — Show matcha version & platform detection
 *   npx matcha why         — 5W1H interactive check
 *   npx matcha audit       — Quick project stack audit
 *   npx matcha help        — Show help
 */

import { execSync } from "child_process";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const CWD = process.cwd();
const cmd = process.argv[2];

// Read package.json for version
let VERSION = "0.0.0";
try {
  const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));
  VERSION = pkg.version;
} catch {}

// ─── Help ─────────────────────────────────────────────────────────────────────
function showHelp() {
  console.log(`
🍵 matcha v${VERSION} — Engineering Convention for AI Coding Agents

Usage:
  npx matcha init           Install matcha to current project (auto-detect platform)
  npx matcha status         Show version, platform, and installed components
  npx matcha why            Run 5W1H check — clarify purpose before coding
  npx matcha audit          Quick project stack audit
  npx matcha verify         Auto-detect test framework and run tests + typecheck
  npx matcha help           Show this help

Install methods:
  curl | bash               https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh
  npx matcha init           Same as above, via npm
  /plugin install           Claude Code marketplace

Docs: https://github.com/plumpslabs/matcha
`);
}

// ─── Init ────────────────────────────────────────────────────────────────────
function cmdInit() {
  console.log(`🍵 matcha init — installing to ${CWD}\n`);

  const installScript = join(PKG_ROOT, "install.sh");
  if (!existsSync(installScript)) {
    console.error("✗ install.sh not found. Are you in the matcha repository?");
    process.exit(1);
  }

  try {
    execSync(`bash "${installScript}"`, { cwd: CWD, stdio: "inherit" });
  } catch (e) {
    console.error(`\n✗ Install failed: ${e.message}`);
    process.exit(1);
  }

  console.log("\n💡 Next steps:");
  console.log("   Run  npx matcha status   to verify installation");
  console.log("   See  QUICKSTART.md        for usage guide");
}

// ─── Status ───────────────────────────────────────────────────────────────────
function cmdStatus() {
  console.log(`🍵 matcha status\n`);

  // Version
  console.log(`  Version:    v${VERSION}`);

  // Platform detection
  const platformFolders = [
    [".claude", "Claude Code"],
    [".opencode", "OpenCode"],
    [".cursor", "Cursor"],
    [".agents", "Agentic IDE / Universal"],
    [".clinerules", "Cline / Roo Code"],
    [".windsurf", "Windsurf"],
    [".kiro", "Kiro"],
    [".openclaw", "OpenClaw"],
    [".qoder", "Qoder"],
    [".qwen", "Qwen Code"],
  ];

  const found = [];
  for (const [folder, name] of platformFolders) {
    if (existsSync(join(CWD, folder))) {
      found.push(name);
      // Check sub-components
      const hasRules = existsSync(join(CWD, folder, "rules")) ||
                       existsSync(join(CWD, folder, "steering"));
      const hasAgents = existsSync(join(CWD, folder, "agents"));
      const hasCommands = existsSync(join(CWD, folder, "commands"));
      const hasSkill = existsSync(join(CWD, folder, "skills"));
      const parts = [];
      if (hasRules) parts.push("rules");
      if (hasAgents) parts.push("agents");
      if (hasCommands) parts.push("commands");
      if (hasSkill) parts.push("skills");
      console.log(`  Platform:   ${name} (${parts.join(", ") || "detected"})`);
    }
  }

  if (found.length === 0) {
    console.log("  Platform:   (none detected)");
    console.log("  → Run  npx matcha init  to install");
  }

  // Check AGENTS.md
  const hasAgentsMd = existsSync(join(CWD, "AGENTS.md"));
  console.log(`  AGENTS.md:  ${hasAgentsMd ? "✅" : "❌"}`);

  // Check matcha-shield
  const hasShield =
    existsSync(join(CWD, "hooks", "matcha-shield.js")) ||
    existsSync(join(CWD, ".qoder", "hooks", "matcha-shield.js"));
  console.log(`  Shield:     ${hasShield ? "✅ active" : "⏭ not installed"}`);

  // Intensity (from env or default)
  const intensity = process.env.MATCHA_INTENSITY || "enforce (default)";
  console.log(`  Intensity:  ${intensity}`);

  console.log(`\n  All systems ${found.length > 0 ? "✅ nominal" : "⏭ pending install"}`);
}

// ─── Why (5W1H interactive) ──────────────────────────────────────────────────
function cmdWhy() {
  const questions = [
    { q: "🎯 What", desc: "What is the actual problem you're solving?" },
    { q: "❓ Why", desc: "What breaks if you skip this?" },
    { q: "👤 Who", desc: "What code/team/service depends on this?" },
    { q: "⏰ When", desc: "Is this needed now, or premature?" },
    { q: "📍 Where", desc: "Where in the codebase does this belong?" },
    { q: "🔧 How", desc: "What's the simplest complete solution?" },
  ];

  console.log(`\n🍵 matcha: 5W1H Gate — Purpose Check`);
  console.log(`  Answer each question. If Why or How is unclear, STOP.\n`);

  // Read from stdin if piped, otherwise show prompts for manual answering
  const isPiped = !process.stdin.isTTY;

  if (isPiped) {
    // Non-interactive mode — read answers from stdin
    let input = "";
    process.stdin.on("data", (chunk) => (input += chunk));
    process.stdin.on("end", () => {
      const lines = input.trim().split("\n");
      console.log("  Answers received:\n");
      questions.forEach(({ q, desc }, i) => {
        const answer = lines[i] || "(empty)";
        console.log(`  ${q}:`);
        console.log(`    ${answer}`);
        if ((q === "❓ Why" || q === "🔧 How") && (!answer || answer === "(empty)")) {
          console.log(`    ⚠️  Cannot answer ${q} — consider STOPPING.\n`);
        }
      });
      console.log("\n  ✅ 5W1H check complete. Proceed with clarity.");
    });
  } else {
    // Interactive mode — show each question
    console.log("  (Run with piped input for automation, or answer manually)\n");
    questions.forEach(({ q, desc }) => {
      console.log(`  ${q} — ${desc}`);
    });
    console.log(`\n  Example: echo "fix login bug|users can't log in|auth service|now|auth/login.ts|check token expiry" | npx matcha why`);
  }
}

// ─── Audit ────────────────────────────────────────────────────────────────────
function cmdAudit() {
  console.log(`🍵 matcha: Stack Audit\n`);

  // Check manifest files
  const manifests = [
    ["package.json", "Node.js / npm"],
    ["pyproject.toml", "Python (PEP 621)"],
    ["requirements.txt", "Python (pip)"],
    ["go.mod", "Go"],
    ["Cargo.toml", "Rust"],
    ["composer.json", "PHP"],
    ["pom.xml", "Java (Maven)"],
    ["build.gradle", "Java (Gradle)"],
    ["Gemfile", "Ruby"],
    ["mix.exs", "Elixir"],
  ];

  let manifestCount = 0;
  for (const [file, label] of manifests) {
    if (existsSync(join(CWD, file))) {
      manifestCount++;
      const content = readFileSync(join(CWD, file), "utf-8").slice(0, 500);
      console.log(`  📄 ${label}  (${file}):`);
      // Show first few dependency lines
      const depLines = content.split("\n").filter(l =>
        l.includes('"') || l.includes("'") || l.includes("require")
      ).slice(0, 3);
      depLines.forEach(l => console.log(`    ${l.trim()}`));
      if (depLines.length === 3) console.log(`    ...`);
      console.log("");
    }
  }

  if (manifestCount === 0) {
    console.log("  No project manifests detected.\n");
  }

  // Check Docker
  if (existsSync(join(CWD, "Dockerfile"))) {
    console.log("  🐳 Dockerfile detected");
  }
  if (existsSync(join(CWD, "docker-compose.yml")) || existsSync(join(CWD, "docker-compose.yaml"))) {
    console.log("  🐳 docker-compose detected (check for service overlap)");
  }

  // Check CI/CD
  const ciFiles = [
    [".github/workflows", "GitHub Actions"],
    [".gitlab-ci.yml", "GitLab CI"],
    ["Jenkinsfile", "Jenkins"],
  ];
  for (const [path, label] of ciFiles) {
    if (existsSync(join(CWD, path))) {
      console.log(`  🔄 ${label}`);
    }
  }

  // Check env
  if (existsSync(join(CWD, ".env"))) {
    console.log("  🔑 .env (contains secrets? Add to .gitignore!)");
  }
  if (existsSync(join(CWD, ".env.example"))) {
    console.log("  🔑 .env.example (good practice ✅)");
  }

  console.log("\n  ✅ Audit complete.");
}

// ─── Verify (Feedback Harness) ────────────────────────────────────────────
function cmdVerify() {
  console.log(`🍵 matcha: Verify — Feedback Harness\n`);

  const detectCommands = [
    // Node.js / TypeScript / React
    { file: "package.json", detect: (content) => {
        if (content.includes('"test"')) return "npm test";
        if (content.includes('"jest"') || content.includes('"@jest"')) return "npx jest";
        if (content.includes('"vitest"')) return "npx vitest run";
        return null;
      },
      typecheck: "npx tsc --noEmit 2>/dev/null || npx tsc --noEmit --project tsconfig.json 2>/dev/null || echo 'no tsc config'",
      lint: "npx eslint . 2>/dev/null || echo 'no eslint config'",
      label: "Node.js" },
    // Python
    { file: "pyproject.toml", detect: (content) => {
        if (content.includes("[tool.pytest")) return "pytest";
        return null;
      },
      typecheck: "mypy . 2>/dev/null || echo 'no mypy config'",
      lint: "ruff check . 2>/dev/null || echo 'no ruff config'",
      label: "Python" },
    { file: "requirements.txt", detect: () => "python -m pytest 2>/dev/null || python3 -m pytest 2>/dev/null", typecheck: null, lint: null, label: "Python" },
    { file: "setup.py", detect: () => "python -m pytest 2>/dev/null || python3 -m pytest 2>/dev/null", typecheck: null, lint: null, label: "Python" },
    // Go
    { file: "go.mod", detect: () => "go test ./...", typecheck: "go vet ./...", lint: "golangci-lint run 2>/dev/null || echo 'no golangci-lint'", label: "Go" },
    // Rust
    { file: "Cargo.toml", detect: () => "cargo test", typecheck: "cargo check", lint: "cargo clippy 2>/dev/null || echo 'no clippy'", label: "Rust" },
    // PHP
    { file: "composer.json", detect: (content) => {
        if (content.includes('"phpunit"') || content.includes('"pest"')) return "vendor/bin/phpunit 2>/dev/null || vendor/bin/pest 2>/dev/null";
        return null;
      },
      typecheck: null, lint: "vendor/bin/phpcs 2>/dev/null || echo 'no phpcs'",
      label: "PHP" },
    // Java
    { file: "pom.xml", detect: () => "which mvn && mvn test -q 2>/dev/null || mvn test -q 2>/dev/null", typecheck: "which mvn && mvn compile -q 2>/dev/null || mvn compile -q 2>/dev/null || true", lint: null, label: "Java (Maven)" },
    { file: "build.gradle", detect: () => "./gradlew test 2>/dev/null || gradle test 2>/dev/null", typecheck: "./gradlew compileJava 2>/dev/null || gradle compileJava 2>/dev/null || true", lint: null, label: "Java (Gradle)" },
    // Makefile
    { file: "Makefile", detect: (content) => {
        if (content.includes("test:")) return "make test";
        return null;
      },
      typecheck: null, lint: null,
      label: "Make" },
  ];

  let foundCommand = null;
  let foundTypecheck = null;
  let foundLint = null;
  let foundLabel = "";

  for (const entry of detectCommands) {
    if (existsSync(join(CWD, entry.file))) {
      try {
        const content = readFileSync(join(CWD, entry.file), "utf-8");
        const cmd = entry.detect(content);
        if (cmd) {
          foundCommand = cmd;
          foundTypecheck = entry.typecheck;
          foundLint = entry.lint;
          foundLabel = entry.label;
          break;
        }
      } catch {}
    }
  }

  if (!foundCommand) {
    console.log("  No test framework detected.");
    console.log("  Known manifests checked: package.json, pyproject.toml, go.mod, Cargo.toml, composer.json, pom.xml, build.gradle, Makefile");
    console.log("\n  Suggestion: navigate to your project root and run relevant tests manually.");
    return;
  }

  console.log(`  Detected: ${foundLabel}`);
  console.log(`  Test cmd: ${foundCommand}\n`);

  // Run tests
  console.log("  ── Running tests ──");
  try {
    execSync(foundCommand, { cwd: CWD, stdio: "inherit", timeout: 120000 });
    console.log(`  ✅ Tests passed`);
  } catch {
    console.log(`  ❌ Tests FAILED`);
    console.log("  → Fix failures before declaring done.");
    process.exitCode = 1;
    return;
  }

  // Run typecheck
  if (foundTypecheck) {
    console.log("\n  ── Running type check ──");
    try {
      execSync(foundTypecheck, { cwd: CWD, stdio: "inherit", timeout: 60000 });
      console.log(`  ✅ Type check passed`);
    } catch {
      console.log(`  ⚠️  Type check had issues (non-blocking)`);
    }
  }

  // Run lint
  if (foundLint) {
    console.log("\n  ── Running linter ──");
    try {
      execSync(foundLint, { cwd: CWD, stdio: "inherit", timeout: 60000 });
      console.log(`  ✅ Lint passed`);
    } catch {
      console.log(`  ⚠️  Lint had issues (non-blocking)`);
    }
  }

  console.log(`\n  ✅ Verify complete.`);
}

// ─── CLI Router ──────────────────────────────────────────────────────────────
switch (cmd) {
  case "verify":
    cmdVerify();
    break;
  case "init":
    cmdInit();
    break;
  case "status":
    cmdStatus();
    break;
  case "why":
    cmdWhy();
    break;
  case "audit":
    cmdAudit();
    break;
  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;
  default:
    // If no command or unknown, show help
    showHelp();
    break;
}
