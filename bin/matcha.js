#!/usr/bin/env node
/**
 * 🍵 matcha CLI
 * Simple. Efficient. Deliberate. Never twice.
 *
 * Usage:
 *   git clone https://github.com/plumpslabs/matcha.git
 *   cd matcha
 *   node bin/matcha.js status   — Show matcha version & platform detection
 *   node bin/matcha.js init     — Install matcha to current directory
 *   node bin/matcha.js help     — Show help
 *
 * Install via:
 *   curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
 */

import { execSync } from "child_process";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";
import { getWorkspaceRoot } from "../hooks/workspace-root.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
// CWD = literal launch dir (init/verify/status target the folder the user
// is standing in). STATE_ROOT = workspace root (monorepo-aware) so state,
// plan, and metrics resolve at the repo root even when launched from a
// sub-project.
const CWD = process.cwd();
const STATE_ROOT = getWorkspaceRoot();
const cmd = process.argv[2];
const subcmd = process.argv[3];

let VERSION = "0.0.0";
try {
  const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));
  VERSION = pkg.version;
} catch {}

const STATE_DIR = join(STATE_ROOT, ".agents");
const STATE_FILE = join(STATE_DIR, "matcha-state.json");
const SESSION_FILE = join(STATE_DIR, "state", "session.json");
const DECISIONS_FILE = join(STATE_DIR, "plan", "decisions.log");
const PLAN_DIR = join(STATE_DIR, "plan");
const METRICS_FILE = join(STATE_DIR, "matcha-metrics.json");

function readState() {
  try {
    if (existsSync(STATE_FILE)) return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {}
  return { intensity: "enforce", version: VERSION };
}

function writeState(state) {
  try {
    if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf-8");
  } catch {}
}

// ─── Help ─────────────────────────────────────────────────────────────────────
function showHelp() {
  console.log(`
🍵 matcha v${VERSION} — Engineering Convention for AI Coding Agents

Usage:
  matcha <command>                   (after: npm install -g @plumpslabs/matcha)
  npx @plumpslabs/matcha <command>   (one-time, no global install)
  node bin/matcha.js <command>       (from a cloned repo)

Commands:
  status     Show version, platform, and installed components
  init       Install matcha into the current project (choose providers)
  init --platforms .opencode,.claude   Install only the listed providers
  metrics    Show matcha impact metrics
  markers    Scan for // matcha: markers in codebase
  verify     Run verification checks (syntax, typecheck, tests)
  state      Save/show session state
  decision   Log a decision (skip, change, add)
  mcp        Start MCP server (stdio JSON-RPC)
  help       Show this help

Install:
  npx @plumpslabs/matcha@latest init                 (via npm — one-time)
  npm install -g @plumpslabs/matcha && matcha init   (global CLI)
  curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash  (no npm)

MCP (Model Context Protocol):
  node hooks/matcha-mcp-server.js    Start MCP server
  npm run mcp                         Same, via npm script

Docs: https://github.com/plumpslabs/matcha
`);
}

// ─── Init ────────────────────────────────────────────────────────────────────
const PLATFORM_OPTIONS = [
  { num: "1", dir: ".claude",    label: "Claude Code" },
  { num: "2", dir: ".opencode",  label: "OpenCode" },
  { num: "3", dir: ".cursor",    label: "Cursor" },
  { num: "4", dir: ".windsurf",  label: "Windsurf" },
  { num: "5", dir: ".clinerules", label: "Cline" },
  { num: "6", dir: ".roo",       label: "Roo Code" },
  { num: "7", dir: ".kiro",      label: "Kiro Code" },
  { num: "8", dir: ".qoder",     label: "Qoder" },
  { num: "9", dir: ".trae",      label: "Trae" },
  { num: "10", dir: ".agents",   label: "Universal (.agents)" },
  { num: "11", dir: ".agents",   label: "Antigravity (agy) — GEMINI.md + .agents" },
];

function detectExistingPlatforms() {
  return PLATFORM_OPTIONS.filter(o => existsSync(join(CWD, o.dir))).map(o => o.dir);
}

function ask(question) {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
  });
}

function detectPolyglotStack(cwd) {
  if (existsSync(join(cwd, "Cargo.toml"))) {
    return { name: "Rust", test: "cargo test", check: "cargo check", build: "cargo build" };
  }
  if (existsSync(join(cwd, "go.mod"))) {
    return { name: "Go", test: "go test ./...", check: "go vet ./...", build: "go build ./..." };
  }
  if (existsSync(join(cwd, "pyproject.toml")) || existsSync(join(cwd, "requirements.txt"))) {
    return { name: "Python", test: "pytest", check: "mypy .", build: "python -m build" };
  }
  if (existsSync(join(cwd, "pom.xml")) || existsSync(join(cwd, "build.gradle"))) {
    return { name: "Java/Kotlin", test: "./gradlew test", check: "./gradlew check", build: "./gradlew build" };
  }
  if (existsSync(join(cwd, "Gemfile"))) {
    return { name: "Ruby", test: "bundle exec rspec", check: "bundle exec rubocop", build: "bundle exec rake" };
  }
  if (existsSync(join(cwd, "composer.json"))) {
    return { name: "PHP", test: "vendor/bin/phpunit", check: "vendor/bin/phpstan", build: "composer build" };
  }
  if (existsSync(join(cwd, "CMakeLists.txt")) || existsSync(join(cwd, "Makefile"))) {
    return { name: "C/C++", test: "make test", check: "make check", build: "make" };
  }
  if (existsSync(join(cwd, "package.json"))) {
    const runner = existsSync(join(cwd, "pnpm-lock.yaml")) ? "pnpm" : existsSync(join(cwd, "yarn.lock")) ? "yarn" : existsSync(join(cwd, "bun.lockb")) ? "bun" : "npm";
    return { name: "Node.js / JavaScript / TypeScript", test: `${runner} test`, check: `${runner} run typecheck`, build: `${runner} run build` };
  }
  return { name: "Polyglot / Generic", test: "[your-test-command]", check: "[your-lint-command]", build: "[your-build-command]" };
}

function ensureMatchaProjectMd(cwd) {
  const projectMdPath = join(cwd, "MATCHA_PROJECT.md");
  if (!existsSync(projectMdPath)) {
    const stack = detectPolyglotStack(cwd);
    const content = `# 🍵 MATCHA_PROJECT.md — Project Constraints

## 1. Stack & Architecture
- **Language / Ecosystem:** ${stack.name}
- **Architecture Pattern:** Pure Core Logic, High Cohesion, Low Coupling

## 2. Verification Commands
- **Typecheck / Lint:** ${stack.check}
- **Test Suite:** ${stack.test}
- **Build Target:** ${stack.build}

## 3. Hard Rules (NEVER Violate)
- All code changes MUST pass empirical verification (${stack.test}).
- Zero N+1 queries, zero unhandled errors, zero silent catches.
- Strictly isolate credentials to environment variables.
- Mark deliberate shortcuts with // matcha: [reason].

## 4. Counterintuitive Patterns (Things that surprise new devs)
- [e.g., API methods return Result types — NEVER throw in service layer]
- [e.g., Named exports only, NO default exports]
- [Run @matcha-planner to scan and populate project-specific patterns]

## 5. Ask First (L3 High Risk Triggers)
- Adding new external dependencies or libraries
- Database schema changes or migrations
- Modifying security, auth, or payment boundary code
`;
    writeFileSync(projectMdPath, content, "utf-8");
    console.log(`  ✓ Generated MATCHA_PROJECT.md (Auto-detected ${stack.name} stack)`);
  } else {
    console.log(`  ✓ MATCHA_PROJECT.md (exists, kept as-is)`);
  }
}

function ensureMemoryScaffold(cwd) {
  // Session memory: live plan + rotating report archive under .agents/
  const planFile = join(cwd, ".agents", "plan", "current.md");
  const reportsDir = join(cwd, ".agents", "reports");
  const today = new Date().toISOString().slice(0, 10);

  if (!existsSync(planFile)) {
    try {
      mkdirSync(join(cwd, ".agents", "plan"), { recursive: true });
      const content = `---\ntitle: Current plan\ndate: ${today}\ntype: plan\nagent: matcha-planner\nstatus: active\ntags: [matcha, plan]\n---\n# 🍵 Intent Discovery — Current Plan\n\n> Living doc. Overwritten at every planning gate. Read at task start to resume continuity.\n\n- **Problem:** (TBD)\n- **Goals:** (TBD)\n- **Success Criteria:** (TBD)\n- **Assumptions:** (TBD)\n- **Unknowns:** (TBD)\n\n## Plan\n- [ ] Step 1 — (TBD)\n- [ ] Step 2 — (TBD)\n\n**▶ Current:** Step 1/2 (0 done) — update after every step\n\n## Risks & Mitigations\n- (TBD)\n`;
      writeFileSync(planFile, content, "utf-8");
      console.log("  ✓ Generated .agents/plan/current.md (session memory — live plan)");
    } catch (e) {
      console.error(`  ✗ Failed to create .agents/plan/current.md: ${e.message}`);
    }
  } else {
    console.log("  ✓ .agents/plan/current.md (exists, kept)");
  }

  if (!existsSync(reportsDir)) {
    try {
      mkdirSync(reportsDir, { recursive: true });
      writeFileSync(join(reportsDir, ".gitkeep"), "", "utf-8");
      console.log("  ✓ Generated .agents/reports/ (agent output archive — rotating, keep latest 5)");
    } catch (e) {
      console.error(`  ✗ Failed to create .agents/reports/: ${e.message}`);
    }
  }
}



async function cmdInit() {
  console.log(`🍵 matcha init — installing to ${CWD}\n`);

  const installScript = join(PKG_ROOT, "install.sh");
  if (!existsSync(installScript)) {
    console.error("✗ install.sh not found. Are you in the matcha repository?");
    process.exit(1);
  }

  // 1. Explicit --platforms flag (or MATCHA_PLATFORMS env) wins — scriptable
  let platformsArg = process.argv[3] === "--platforms" ? process.argv[4] : "";
  if (!platformsArg && process.env.MATCHA_PLATFORMS) platformsArg = process.env.MATCHA_PLATFORMS;

  // 2. Interactive provider picker (only when attached to a terminal)
  if (!platformsArg && process.stdin.isTTY) {
    const existing = detectExistingPlatforms();
    console.log("Select providers to configure (comma-separated, e.g. 1,2):");
    for (const o of PLATFORM_OPTIONS) {
      const mark = existing.includes(o.dir) ? " (detected)" : "";
      console.log(`  ${o.num}. ${o.label}${mark}`);
    }
    console.log("  ℹ️  AGENTS.md + CLAUDE.md + GEMINI.md + QWEN.md + Copilot instructions are always installed (Claude, Antigravity, Qwen, Gemini, Copilot, Codex, Zed).");
    console.log("  a. All platforms");
    console.log("  0. Auto (detected providers, or Universal if none) — default");
    console.log("");
    const answer = await ask("Choice [0]: ");
    const choice = (answer || "0").toLowerCase();
    if (choice === "a" || choice === "all") {
      platformsArg = PLATFORM_OPTIONS.map(o => o.dir).join(" ");
    } else if (choice !== "0" && choice !== "auto" && choice !== "") {
      const dirs = choice
        .split(/[\s,]+/)
        .map(n => {
          const o = PLATFORM_OPTIONS.find(p => p.num === n);
          return o ? o.dir : null;
        })
        .filter(Boolean);
      platformsArg = dirs.join(" ");
    }
    if (platformsArg) console.log(`  → Installing providers: ${platformsArg}\n`);
  }

  const flag = platformsArg ? ` --platforms "${platformsArg}"` : "";
  try {
    execSync(`bash "${installScript}"${flag}`, { cwd: CWD, stdio: "inherit" });
  } catch (e) {
    console.error(`\n✗ Install failed: ${e.message}`);
    process.exit(1);
  }

  // 3. Auto-generate MATCHA_PROJECT.md for polyglot stack
  ensureMatchaProjectMd(CWD);

  // 4. Scaffold session memory (live plan + rotating report archive)
  ensureMemoryScaffold(CWD);

  console.log("\n💡 Next steps:");
  console.log("   Verify: ls AGENTS.md GEMINI.md MATCHA_PROJECT.md hooks/matcha-shield.js");

}

// ─── Status ───────────────────────────────────────────────────────────────────
function cmdStatus() {
  console.log(`🍵 matcha status\n`);

  console.log(`  Version:    v${VERSION}`);

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
      const hasRules = existsSync(join(CWD, folder, "rules")) ||
                       existsSync(join(CWD, folder, "steering"));
      const hasAgents = existsSync(join(CWD, folder, "agents"));
      const hasCommands = existsSync(join(CWD, folder, "commands"));
      const parts = [];
      if (hasRules) parts.push("rules");
      if (hasAgents) parts.push("agents");
      if (hasCommands) parts.push("commands");
      console.log(`  Platform:   ${name} (${parts.join(", ") || "detected"})`);
    }
  }

  if (found.length === 0) {
    console.log("  Platform:   (none detected)");
    console.log("  → Run  curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash");
  }

  const hasAgentsMd = existsSync(join(CWD, "AGENTS.md"));
  console.log(`  AGENTS.md:  ${hasAgentsMd ? "✅" : "❌"}`);

  const hasShield = existsSync(join(CWD, "hooks", "matcha-shield.js"));
  console.log(`  Shield:     ${hasShield ? "✅ active" : "⏭ not installed"}`);

  let intensity = process.env.MATCHA_INTENSITY || "enforce (default)";
  try {
    const statePath = join(STATE_ROOT, ".agents/matcha-state.json");
    if (existsSync(statePath)) {
      const state = JSON.parse(readFileSync(statePath, "utf-8"));
      if (state.intensity) intensity = state.intensity;
    }
  } catch {}
  console.log(`  Intensity:  ${intensity}`);

  console.log(`\n  All systems ${found.length > 0 ? "✅ nominal" : "⏭ pending install"}`);
}

// ─── Markers — Scan for // matcha: comments ─────────────────────────────────
function cmdMarkers() {
  console.log(`🍵 matcha: markers\n`);

  const extInclude = "--include='*.js' --include='*.ts' --include='*.jsx' --include='*.tsx' --include='*.py' --include='*.go' --include='*.rs'";
  try {
    const output = execSync(`grep -rn '// matcha:' ${extInclude} . 2>/dev/null || true`,
      { cwd: CWD, timeout: 5000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();

    if (!output) {
      console.log("  No // matcha: markers found.\n");
      console.log("  Tip: Mark intentional shortcuts with:");
      console.log("    // matcha:explain [reason]");
      console.log("    // matcha:debt [reason], [fix when]");
      console.log("    // matcha:todo [task]");
      return;
    }

    const lines = output.split("\n");
    const byLevel = { explain: [], debt: [], todo: [], adr: [], other: [] };

    for (const line of lines) {
      if (line.includes("// matcha:explain")) byLevel.explain.push(line);
      else if (line.includes("// matcha:debt")) byLevel.debt.push(line);
      else if (line.includes("// matcha:todo")) byLevel.todo.push(line);
      else if (line.includes("// matcha:adr")) byLevel.adr.push(line);
      else byLevel.other.push(line);
    }

    console.log(`  Total markers: ${lines.length}\n`);
    console.log(`  explain: ${byLevel.explain.length} (LOW)`);
    console.log(`  debt:    ${byLevel.debt.length} (HIGH)`);
    console.log(`  todo:    ${byLevel.todo.length} (MEDIUM)`);
    console.log(`  adr:     ${byLevel.adr.length} (INFO)`);
    console.log(`  other:   ${byLevel.other.length}\n`);

    if (byLevel.debt.length > 0) {
      console.log("  HIGH items (debt):");
      for (const d of byLevel.debt.slice(0, 10)) {
        console.log(`    ${d}`);
      }
      if (byLevel.debt.length > 10) console.log(`    ... and ${byLevel.debt.length - 10} more`);
      console.log("");
    }
  } catch {
    console.error("  Failed to scan for markers. Is ripgrep/grep available?");
  }
}

// ─── Verify — Run verification checks ────────────────────────────────────────
function cmdVerify() {
  console.log(`🍵 matcha: verify\n`);
  const state = readState();
  const intensity = state.intensity || "enforce";
  const stack = detectPolyglotStack(CWD);

  const results = [];
  let allPassed = true;

  function check(name, fn) {
    try {
      const ok = fn();
      results.push({ name, status: ok ? "PASS" : "FAIL", detail: "" });
      if (!ok) allPassed = false;
    } catch (e) {
      results.push({ name, status: "FAIL", detail: e.message });
      allPassed = false;
    }
  }

  // 1. Stack Detection Info
  console.log(`  Stack Detected: ${stack.name}`);

  // 2. Syntax / Typecheck / Verification Check
  check(`Check (${stack.check})`, () => {
    if (stack.check.includes("[your-")) return true;
    execSync(`${stack.check} 2>&1 || true`, { cwd: CWD, timeout: 30000, stdio: "pipe" });
    return true;
  });

  // 3. Test Runner Execution
  check(`Tests (${stack.test})`, () => {
    if (stack.test.includes("[your-")) return true;
    try {
      execSync(`${stack.test} 2>&1`, { cwd: CWD, timeout: 60000, stdio: "pipe" });
      return true;
    } catch (e) {
      if (intensity === "audit") {
        console.log(`  ⚠️ Test suite failed at audit intensity.\n`);
        return false;
      }
      return true; // Warn / report
    }
  });

  console.log(`\n  Results (intensity: ${intensity}):\n`);
  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : "❌";
    console.log(`  ${icon} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }

  const criticalCount = results.filter(r => r.status === "FAIL").length;
  const result = allPassed ? "PASSED" : criticalCount > 0 ? "FAILED" : "PASSED_WITH_WARNINGS";
  console.log(`\n  Result: ${result}`);
}


// ─── State — Session state management ────────────────────────────────────────
function cmdState() {
  if (subcmd === "save") {
    const sessionId = process.argv[4] || `session-${Date.now()}`;
    const session = {
      session_id: sessionId,
      started_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      status: "active",
      current_phase: process.argv[5] || "",
      intensity: readState().intensity || "enforce",
    };
    try {
      if (!existsSync(join(STATE_DIR, "state"))) mkdirSync(join(STATE_DIR, "state"), { recursive: true });
      writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2) + "\n", "utf-8");
      console.log(`🍵 matcha: session saved (${sessionId})`);
    } catch (e) {
      console.error(`✗ Failed to save session: ${e.message}`);
    }
    return;
  }

  // Show state
  try {
    if (existsSync(SESSION_FILE)) {
      const session = JSON.parse(readFileSync(SESSION_FILE, "utf-8"));
      console.log(`🍵 matcha: session state\n`);
      console.log(`  Session ID:    ${session.session_id}`);
      console.log(`  Status:        ${session.status}`);
      console.log(`  Started:       ${session.started_at}`);
      console.log(`  Last active:   ${session.last_active}`);
      if (session.current_phase) console.log(`  Current phase: ${session.current_phase}`);
      if (session.resume_note) console.log(`  Resume note:   ${session.resume_note}`);
      console.log(`  Intensity:     ${session.intensity}`);
    } else {
      console.log("  No active session.");
      console.log("  Start one: node bin/matcha.js state save <session-id>");
    }
  } catch (e) {
    console.error(`✗ Failed to read session state: ${e.message}`);
  }
}

// ─── Decision — Log a decision ───────────────────────────────────────────────
function cmdDecision() {
  const decisionType = subcmd || "";
  const reason = process.argv.slice(4).join(" ") || "";

  if (!decisionType || !reason) {
    console.log(`🍵 matcha: decision\n`);
    console.log("  Log a decision to .agents/plan/decisions.log");
    console.log("");
    console.log("  Usage: node bin/matcha.js decision <type> <reason>");
    console.log("  Types: skip, change, add, explain, defer");
    console.log("");
    console.log("  Examples:");
    console.log('    node bin/matcha.js decision skip "Task 3.9: debug effects intentionally dep-less"');
    console.log('    node bin/matcha.js decision change "Switched from Redis to in-memory for this scope"');
    return;
  }

  const entry = [
    `---`,
    `date: ${new Date().toISOString()}`,
    `type: ${decisionType}`,
    `reason: ${reason}`,
    `---`,
  ].join("\n");

  try {
    if (!existsSync(PLAN_DIR)) mkdirSync(PLAN_DIR, { recursive: true });
    writeFileSync(DECISIONS_FILE, entry + "\n", { encoding: "utf-8", flag: "a" });
    console.log(`🍵 matcha: decision logged (${decisionType})`);
    console.log(`  ${reason}`);
  } catch (e) {
    console.error(`✗ Failed to log decision: ${e.message}`);
  }
}

// ─── Metrics — Impact tracking ──────────────────────────────────────────────
function cmdMetrics() {
  console.log(`🍵 matcha: metrics\n`);

  let metrics = { sessions: [], totals: { sessions: 0, tasks: 0, issuesFound: 0, falsePositives: 0 } };
  try {
    if (existsSync(METRICS_FILE)) {
      metrics = JSON.parse(readFileSync(METRICS_FILE, "utf-8"));
    }
  } catch {}

  const t = metrics.totals;
  console.log(`  📊 All-Time Metrics`);
  console.log(`  Sessions:       ${t.sessions}`);
  console.log(`  Tasks:          ${t.tasks}`);
  console.log(`  Issues caught:  ${t.issuesFound} (prevented from shipping)`);
  console.log(`  False positives: ${t.falsePositives}`);

  if (t.sessions > 0) {
    const fpRate = t.issuesFound > 0 ? Math.round((t.falsePositives / t.issuesFound) * 100) : 0;
    console.log(`  FP rate:        ${fpRate}%`);
    console.log(`  Avg tasks/session: ${Math.round(t.tasks / t.sessions)}`);
  }

  if (metrics.sessions.length > 0) {
    console.log(`\n  📈 Recent Sessions`);
    const recent = metrics.sessions.slice(-5);
    for (const s of recent) {
      const date = new Date(s.started).toLocaleDateString();
      console.log(`    ${date}: ${s.tasks} tasks, ${s.issuesFound} issues`);
    }
  }

  if (t.sessions === 0) {
    console.log(`\n  No metrics yet. Start using matcha to track impact.`);
  }
}

// ─── CLI Router ──────────────────────────────────────────────────────────────
function cmdMcp() {
  const serverPath = join(PKG_ROOT, "hooks", "matcha-mcp-server.js");
  // MCP server runs as a long-lived stdio process — exec blocks until it exits
  execSync(`node "${serverPath}"`, { stdio: "inherit" });
}

(async () => {
switch (cmd) {
  case "init":
    await cmdInit();
    break;
  case "status":
    cmdStatus();
    break;
  case "metrics":
    cmdMetrics();
    break;
  case "markers":
    cmdMarkers();
    break;
  case "verify":
    cmdVerify();
    break;
  case "state":
    cmdState();
    break;
  case "decision":
    cmdDecision();
    break;
  case "mcp":
    cmdMcp();
    break;
  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;
  default:
    showHelp();
    break;
}
})();
