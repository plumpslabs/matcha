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

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const CWD = process.cwd();
const cmd = process.argv[2];
const subcmd = process.argv[3];

let VERSION = "0.0.0";
try {
  const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));
  VERSION = pkg.version;
} catch {}

const STATE_DIR = join(CWD, ".agents");
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

Usage (from cloned repo):
  node bin/matcha.js status    Show version, platform, and installed components
  node bin/matcha.js init      Install matcha to current directory
  node bin/matcha.js stats     Show session health statistics
  node bin/matcha.js metrics   Show matcha impact metrics
  node bin/matcha.js markers   Scan for // matcha: markers in codebase
  node bin/matcha.js verify    Run verification checks (syntax, typecheck, tests)
  node bin/matcha.js state     Save/show session state
  node bin/matcha.js decision  Log a decision (skip, change, add)
  node bin/matcha.js mcp       Start MCP server (stdio JSON-RPC)
  node bin/matcha.js help      Show this help

Install:
  curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash

MCP (Model Context Protocol):
  node hooks/matcha-mcp-server.js    Start MCP server
  npm run mcp                         Same, via npm script

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
  console.log("   Run  node bin/matcha.js status   to verify installation");
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
    const statePath = join(CWD, ".agents/matcha-state.json");
    if (existsSync(statePath)) {
      const state = JSON.parse(readFileSync(statePath, "utf-8"));
      if (state.intensity) intensity = state.intensity;
    }
  } catch {}
  console.log(`  Intensity:  ${intensity}`);

  console.log(`\n  All systems ${found.length > 0 ? "✅ nominal" : "⏭ pending install"}`);
}

// ─── Stats — Session Health ───────────────────────────────────────────────────
function cmdStats() {
  console.log(`🍵 matcha stats\n`);

  const state = readState();

  // Files changed (git diff)
  let filesChanged = 0, linesAdded = 0, linesRemoved = 0;
  try {
    const diffStat = execSync("git diff --stat", { cwd: CWD, timeout: 3000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    const files = diffStat.match(/\d+ file\w+ changed/);
    filesChanged = files ? parseInt(files[0]) : 0;
    const additions = diffStat.match(/(\d+) insertion/);
    linesAdded = additions ? parseInt(additions[1]) : 0;
    const deletions = diffStat.match(/(\d+) deletion/);
    linesRemoved = deletions ? parseInt(deletions[1]) : 0;
  } catch {}
  console.log(`  Files changed:  ${filesChanged} (+${linesAdded} / -${linesRemoved} lines)`);

  // Tests
  let testsPassed = "unknown", totalTests = 0;
  try {
    const testRun = execSync("npm test 2>&1 || true", { cwd: CWD, timeout: 30000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    const passMatch = testRun.match(/(\d+) passed/);
    const failMatch = testRun.match(/(\d+) failed/);
    totalTests = passMatch ? parseInt(passMatch[1]) : 0;
    testsPassed = failMatch && parseInt(failMatch[1]) > 0 ? `FAIL (${failMatch[1]} failed)` : `${totalTests} passed`;
  } catch {}
  console.log(`  Tests:          ${testsPassed}`);

  // Decisions from log
  let decisions = 0;
  try {
    if (existsSync(DECISIONS_FILE)) {
      const content = readFileSync(DECISIONS_FILE, "utf-8");
      decisions = content.split("\n---\n").filter(d => d.trim()).length;
    }
  } catch {}
  console.log(`  Decisions:      ${decisions}`);

  // matcha: markers
  let markers = 0;
  try {
    const markerCount = execSync("grep -r '// matcha:' --include='*.js' --include='*.ts' --include='*.jsx' --include='*.tsx' --include='*.py' --include='*.go' --include='*.rs' . 2>/dev/null | wc -l || echo 0",
      { cwd: CWD, timeout: 5000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
    markers = parseInt(markerCount) || 0;
  } catch {}
  console.log(`  Matcha markers: ${markers}`);

  // Phases from plan
  let phases = "none";
  const planDir = join(CWD, ".agents/plan");
  try {
    if (existsSync(planDir)) {
      const files = execSync("ls .agents/plan/*.yaml .agents/plan/*.log 2>/dev/null || true",
        { cwd: CWD, timeout: 2000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
      if (files) phases = files.split("\n").length.toString();
    }
  } catch {}
  console.log(`  Plan artifacts: ${phases}`);

  // Session
  let duration = "unknown";
  try {
    if (existsSync(SESSION_FILE)) {
      const session = JSON.parse(readFileSync(SESSION_FILE, "utf-8"));
      if (session.started_at) {
        const elapsed = Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000);
        duration = elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`;
      }
    }
  } catch {}
  console.log(`  Duration:       ${duration}`);
  console.log(`  Intensity:      ${state.intensity || "enforce"}`);
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

  // 1. Syntax check
  check("Syntax", () => {
    execSync("node --check bin/matcha.js", { cwd: CWD, timeout: 5000, stdio: "pipe" });
    execSync("node --check hooks/matcha-shield.js", { cwd: CWD, timeout: 5000, stdio: "pipe" });
    return true;
  });

  // 2. Test detection
  let testsFound = 0;
  check("Tests", () => {
    try {
      const testFiles = execSync("find tests -name '*.test.js' -o -name '*.test.ts' 2>/dev/null | wc -l",
        { cwd: CWD, timeout: 3000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
      testsFound = parseInt(testFiles) || 0;
      if (testsFound === 0) {
        if (intensity === "audit") {
          console.log("  ⚠️  No tests found. At audit intensity, at least 1 smoke test required.\n");
          return false;
        }
        console.log("  ⚠️  No test files detected. Consider adding tests.\n");
        return true; // warn but don't fail for enforce/observe
      }
      return true;
    } catch {
      return true;
    }
  });

  // 3. Typecheck (if tsconfig exists)
  check("Typecheck", () => {
    if (existsSync(join(CWD, "tsconfig.json"))) {
      execSync("npx tsc --noEmit 2>&1 || true", { cwd: CWD, timeout: 30000, stdio: "pipe" });
    }
    return true; // non-TS projects pass by default
  });

  // 4. Lint (if ESLint config exists)
  check("Lint", () => {
    if (existsSync(join(CWD, ".eslintrc")) || existsSync(join(CWD, ".eslintrc.js")) || existsSync(join(CWD, ".eslintrc.json"))) {
      execSync("npx eslint . 2>&1 || true", { cwd: CWD, timeout: 30000, stdio: "pipe" });
    }
    return true;
  });

  console.log(`  Results (intensity: ${intensity}):\n`);
  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : "❌";
    console.log(`  ${icon} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }

  // Determine overall result
  const criticalCount = results.filter(r => r.status === "FAIL").length;
  const result = allPassed ? "PASSED" : criticalCount > 0 ? "FAILED" : "PASSED_WITH_WARNINGS";
  console.log(`\n  Result: ${result} (${testsFound} test files found)`);
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

switch (cmd) {
  case "init":
    cmdInit();
    break;
  case "status":
    cmdStatus();
    break;
  case "stats":
    cmdStats();
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
