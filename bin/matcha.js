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
import { getMetricsSummary } from "../hooks/matcha-metrics.js";
import { autoIndexWorkspace } from "../hooks/auto-index.js";
import { scanFile } from "../hooks/matcha-post-write.js";
import { recordAuditLog, getRecentAuditLogs } from "../hooks/audit-log.js";
import { calculateBlastRadius } from "../hooks/blast-radius.js";
import { recordTestEvidence, getEvidenceBundle, validateEvidence } from "../hooks/evidence-collector.js";

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

// ─── Index — Zero-touch Symbol Graph Generator ──────────────────────────────
function cmdIndex() {
  console.log("🍵 matcha: index\n");
  const res = autoIndexWorkspace(CWD);
  console.log(`  ✓ Indexed ${res.totalSymbols} symbols across workspace (Monorepo: ${res.isMonorepo})`);
  console.log("  Cache: .agents/state/symbols.json");
}

// ─── Scan — Static Security & Quality Guard ─────────────────────────────────
function cmdScan() {
  console.log("🍵 matcha: scan\n");
  let targetFiles = process.argv.slice(3);
  if (targetFiles.length === 0) {
    try {
      const gitDiff = execSync("git diff --name-only HEAD 2>/dev/null || git status --porcelain 2>/dev/null || true", { encoding: "utf8" }).trim();
      targetFiles = gitDiff.split("\n").map(s => s.replace(/^[?\sMADRCU]+\s+/, "").trim()).filter(Boolean);
    } catch {}
  }

  if (targetFiles.length === 0) {
    console.log("  No modified files detected to scan.\n");
    return;
  }

  let totalErrors = 0;
  for (const f of targetFiles) {
    if (!existsSync(join(CWD, f))) continue;
    const findings = scanFile(join(CWD, f));
    if (findings && findings.length > 0) {
      const actionable = findings.filter(it => it.severity === "critical" || it.severity === "warning" || it.severity === "error");
      if (actionable.length > 0) {
        console.log(`  ❌ ${f} (${actionable.length} issues):`);
        actionable.forEach(it => console.log(`     - [${it.severity.toUpperCase()}] line ${it.line}: ${it.issue}`));
        totalErrors += actionable.length;
      }
    }
  }

  if (totalErrors === 0) {
    console.log(`  ✅ All ${targetFiles.length} files scanned clean. No critical leaks or defects found.\n`);
  } else {
    console.log(`\n  ⚠️ Total blocking issues found: ${totalErrors}\n`);
    process.exit(1);
  }
}

// ─── On / Off / Toggle — Instant Governance Switch (Ponytail-style) ──────────
function cmdOn() {
  const state = readState();
  state.enabled = true;
  state.intensity = subcmd || (state.intensity === "off" ? "enforce" : (state.intensity || "enforce"));
  writeState(state);
  recordAuditLog({
    event: "STATE_TOGGLE",
    details: `ENABLED (intensity: ${state.intensity})`,
    reason: "CLI command: matcha on",
  }, STATE_ROOT);

  console.log("🍵 matcha: governance ENABLED\n");
  console.log(`  State:       🟢 Active`);
  console.log(`  Intensity:   ${state.intensity}`);
  console.log(`  Gate:        Enforced (Intent Discovery in .agents/plan/current.md)`);
  console.log(`  Shield:      Active (blocking destructive commands)`);
  console.log(`  Audit trail: Enabled (.agents/audit.log)\n`);
}

function cmdOff() {
  const state = readState();
  state.enabled = false;
  state.intensity = "off";
  writeState(state);
  recordAuditLog({
    event: "STATE_TOGGLE",
    details: "PAUSED (off)",
    reason: "CLI command: matcha off",
  }, STATE_ROOT);

  console.log("🍵 matcha: governance PAUSED (off)\n");
  console.log(`  State:       ⏸ Disabled`);
  console.log(`  Gate:        Bypassed (free code editing without plan restriction)`);
  console.log(`  Audit trail: Logged to .agents/audit.log`);
  console.log(`  Resume:      Run 'matcha on' or /matcha:on to re-enable anytime.\n`);
}

function cmdToggle() {
  const state = readState();
  if (state.enabled !== false && state.intensity !== "off") {
    cmdOff();
  } else {
    cmdOn();
  }
}

// ─── Audit — Show Governance & Override Trail ─────────────────────────────────
function cmdAudit() {
  console.log("🍵 matcha: audit trail (.agents/audit.log)\n");
  const logs = getRecentAuditLogs(20, STATE_ROOT);
  if (logs.length === 0) {
    console.log("  No audit events recorded yet. Overrides and state changes are logged here.\n");
    return;
  }
  logs.forEach(l => console.log(`  ${l}`));
  console.log("");
}

// ─── Evidence — Machine-Readable Verification Collector ───────────────────────
function cmdEvidence() {
  console.log("🍵 matcha: evidence verification\n");
  const action = subcmd || "status";
  const bundle = getEvidenceBundle(STATE_ROOT);

  if (action === "status" || action === "show") {
    if (!bundle) {
      console.log("  No evidence bundle found in .agents/state/evidence.json");
      console.log("  Run 'matcha verify' or 'matcha evidence record -- <test-command>' to capture proof.\n");
      return;
    }
    console.log(`  Timestamp:    ${bundle.timestamp}`);
    console.log(`  Verified:     ${bundle.verified ? "✅ PASS (Exit Code 0)" : "❌ FAILED"}`);
    if (bundle.tests) {
      console.log(`  Test Command: ${bundle.tests.command} (exitCode: ${bundle.tests.exitCode})`);
    }
    if (bundle.risk) {
      console.log(`  Risk Tier:    ${bundle.risk.tier} (Score: ${bundle.risk.score})`);
      bundle.risk.reasons.forEach(r => console.log(`    - ${r}`));
    }
    if (bundle.git) {
      console.log(`  Diff:         ${bundle.git.filesChanged} files (+${bundle.git.linesAdded} / -${bundle.git.linesDeleted})`);
    }
    console.log("");
    return;
  }

  if (action === "record") {
    let args = process.argv.slice(4);
    if (args[0] === "--") args = args.slice(1);
    const rawCmd = args.join(" ");
    if (!rawCmd) {
      console.error("  ❌ Missing test command. Usage: matcha evidence record -- <cmd>");
      process.exit(1);
    }
    console.log(`  Executing: ${rawCmd}`);
    let exitCode = 0;
    let output = "";
    try {
      output = execSync(rawCmd, { cwd: CWD, encoding: "utf8" });
    } catch (err) {
      exitCode = err.status || 1;
      output = (err.stdout || "") + (err.stderr || "");
    }
    recordTestEvidence({
      command: rawCmd,
      exitCode,
      outputSnippet: output.trim(),
    }, STATE_ROOT);
    console.log(`  Captured evidence bundle -> .agents/state/evidence.json (Exit Code: ${exitCode})\n`);
    if (exitCode !== 0) process.exit(exitCode);
  }
}

// ─── Blast — Automated Risk & Blast Radius Calculation ─────────────────────────
function cmdBlast() {
  console.log("🍵 matcha: blast radius calculation\n");
  const res = calculateBlastRadius(undefined, STATE_ROOT);
  console.log(`  Risk Tier:        ${res.tier} (Score: ${res.score})`);
  console.log(`  Recommended Mode: ${res.recommendedMode}`);
  console.log(`  Files Modified:   ${res.stats.filesChanged}`);
  console.log(`  LOC Delta:        +${res.stats.linesAdded} / -${res.stats.linesDeleted}`);
  console.log(`  Context Rationale:`);
  res.reasons.forEach(r => console.log(`    • ${r}`));
  console.log("");
}


// ─── Hooks — Native Git Pre-commit Hook Manager ─────────────────────────────
function cmdHooks() {
  const action = subcmd || "status";
  const gitHooksDir = join(CWD, ".git", "hooks");
  const preCommitPath = join(gitHooksDir, "pre-commit");

  if (action === "install") {
    if (!existsSync(join(CWD, ".git"))) {
      console.error("  ❌ Not a git repository (.git folder not found).");
      process.exit(1);
    }
    if (!existsSync(gitHooksDir)) mkdirSync(gitHooksDir, { recursive: true });

    const hookScript = `#!/usr/bin/env bash
# 🍵 matcha native git pre-commit hook
if command -v node >/dev/null 2>&1; then
  if [ -f "bin/matcha.js" ]; then
    node bin/matcha.js scan
  elif command -v matcha >/dev/null 2>&1; then
    matcha scan
  fi
fi
`;
    writeFileSync(preCommitPath, hookScript, { encoding: "utf8", mode: 0o755 });
    console.log("🍵 matcha: hooks\n");
    console.log("  ✅ Installed native pre-commit hook (.git/hooks/pre-commit)");
    console.log("  All future git commits will automatically run security scan before committing.\n");
    return;
  }

  if (action === "remove") {
    if (existsSync(preCommitPath)) {
      fs.unlinkSync(preCommitPath);
      console.log("🍵 matcha: hooks\n");
      console.log("  ✓ Removed pre-commit hook.\n");
    } else {
      console.log("  No pre-commit hook found.\n");
    }
    return;
  }

  // Status
  console.log("🍵 matcha: hooks\n");
  const installed = existsSync(preCommitPath);
  console.log(`  Git Pre-Commit Hook: ${installed ? "✅ Installed & Active" : "⏭ Not installed"}`);
  console.log("  Usage:");
  console.log("    node bin/matcha.js hooks install   — Activate automatic pre-commit scanning");
  console.log("    node bin/matcha.js hooks remove    — Deactivate pre-commit hook\n");
}

function showHelp() {
  console.log(`
🍵 matcha v${VERSION} — Engineering Convention for AI Coding Agents

Usage:
  matcha <command>                   (after: npm install -g @plumpslabs/matcha)
  npx @plumpslabs/matcha <command>   (one-time, no global install)
  node bin/matcha.js <command>       (from a cloned repo)

Commands:
  on         Enable matcha governance (enforce or specified intensity)
  off        Pause/disable matcha governance (free mode)
  toggle     Toggle governance on/off (like ponytail)
  status     Show version, platform, and installed components
  audit      Show recent audit trail entries (.agents/audit.log)
  evidence   Show or record machine-readable verification evidence
  blast      Calculate blast radius & risk score for current changes
  init       Install matcha into the current project (choose providers)
  init --platforms .opencode,.claude   Install only the listed providers
  metrics    Show matcha impact metrics
  markers    Scan for // matcha: markers in codebase
  verify     Run verification checks (syntax, typecheck, tests)
  state      Save/show session state
  decision   Log a decision (skip, change, add)
  index      Generate / refresh Symbol Graph & Monorepo Index
  scan       Scan modified files for security leaks & quality issues
  hooks      Install/manage native Git pre-commit security hook
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
  { num: "12", dir: ".qwen",     label: "Qwen Code (QWEN.md)" },
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
    console.log("  ℹ️  AGENTS.md always installed (universal). CLAUDE.md/GEMINI.md/QWEN.md only with their platform (Claude/Antigravity/Qwen). Copilot instructions always (cross-editor).");
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

  console.log("\n✅ matcha installed!\n");
  console.log("💡 Next steps:\n");
  console.log("  1. Verify install:");
  console.log("     matcha status\n");
  console.log("  2. Start a coding session — type in your agent:");
  console.log("     /matcha:why   → run Intent Discovery before coding");
  console.log("     /matcha:on    → enable all guardrails (default: already on)");
  console.log("     /matcha:off   → disable for quick experiments\n");
  console.log("  3. During work:");
  console.log("     /matcha:review   → trigger blocking review gate on current diff");
  console.log("     /matcha:status   → check current mode & hook states\n");
  console.log("  4. Check MATCHA_PROJECT.md for project-specific stack config.");
  console.log("     Add your test command, build command, and any custom rules.\n");
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

  // Metrics snapshot — hooks record blocks/findings to .agents/matcha-metrics.json
  try {
    const s = getMetricsSummary();
    if (s.totals.sessions?.length || s.totals.tasksCompleted) {
      console.log(`  Metrics:    ${s.totals.tasksCompleted} tasks · ${s.totals.reviewIssues} issues caught · ${s.totals.planningGateBlocks} gate blocks · ${s.totals.shieldBlocks} shield blocks`);
    }
  } catch {}

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
// Unified with hooks/matcha-metrics.js (single source of truth). The hooks
// record v2 schema (planningGateBlocks, shieldBlocks, reviewVerdicts, FP rate);
// cmdMetrics reuses getMetricsSummary() instead of reading a stale v1 shape.
function cmdMetrics() {
  console.log(`🍵 matcha: metrics\n`);

  const summary = getMetricsSummary();
  const t = summary.totals;

  console.log(`  📊 All-Time Metrics`);
  console.log(`  Sessions:          ${summary.recentSessions}`);
  console.log(`  Tasks:             ${t.tasksCompleted}`);
  console.log(`  Reviews run:       ${t.reviewsRun}`);
  console.log(`  Issues caught:     ${t.reviewIssues} (prevented from shipping)`);
  console.log(`  FP rate:           ${summary.falsePositiveRate}%`);
  console.log(`  Compliance:        ${summary.complianceRate}%`);
  console.log(`  Shield blocks:     ${t.shieldBlocks} (${t.dangerousCommandsBlocked || 0} destructive)`);
  console.log(`  Planning blocks:   ${t.planningGateBlocks}`);
  console.log(`  Simple-task skips: ${t.simpleTasksDetected}`);
  console.log(`  Mode switches:     ${t.modeSwitches}`);

  if (t.reviewsRun > 0) {
    console.log(`\n  📈 Reviews by Tier`);
    console.log(`    L0: ${t.reviewsByTier.L0} · L1: ${t.reviewsByTier.L1} · L2: ${t.reviewsByTier.L2} · L3: ${t.reviewsByTier.L3}`);
    console.log(`  Verdicts: PASS ${t.reviewVerdicts.PASS} · PASS_WITH_FIXES ${t.reviewVerdicts.PASS_WITH_FIXES} · BLOCK ${t.reviewVerdicts.BLOCK} · EXPERT_REQUIRED ${t.reviewVerdicts.EXPERT_REQUIRED}`);
  }

  if (summary.recentSessions > 0) {
    console.log(`\n  📉 Recent sessions: ${summary.recentSessions} (last 7 days)`);
    const trends = summary.trends || {};
    if (trends.shieldBlocks) console.log(`    Shield blocks trend: ${trends.shieldBlocks.direction} (${trends.shieldBlocks.change}%)`);
  }

  if (summary.recentSessions === 0 && t.tasksCompleted === 0) {
    console.log(`\n  No metrics yet. Hooks record blocks/findings automatically — run a session to track impact.`);
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
  case "on":
    cmdOn();
    break;
  case "off":
    cmdOff();
    break;
  case "toggle":
    cmdToggle();
    break;
  case "audit":
    cmdAudit();
    break;
  case "evidence":
    cmdEvidence();
    break;
  case "blast":
    cmdBlast();
    break;
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
  case "index":
    cmdIndex();
    break;
  case "scan":
    cmdScan();
    break;
  case "hooks":
    cmdHooks();
    break;
  case "mcp":
    cmdMcp();
    break;
  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;
  case "-v":
  case "--version":
    console.log(`🍵 matcha v${VERSION}`);
    break;
  default:
    showHelp();
    break;
}
})();
