#!/usr/bin/env node
/**
 * 🍵 matcha — live-repo-runner.js
 * Real project benchmark: clones/copies a repo fixture and runs Claude Code
 * against feature specs. Measures LOC added/changed, test pass rate, and
 * matcha compliance of generated code.
 *
 * Usage:
 *   node benchmark/live-repo-runner.js --task add-activity-endpoint
 *   node benchmark/live-repo-runner.js --arm matcha
 *   node benchmark/live-repo-runner.js --full              ← all arms × all tasks
 *   node benchmark/live-repo-runner.js --simulate           ← skip Claude, use fixture
 *
 * Matcha-style: minimal abstractions, clean output, explicit error handling.
 */

import { execSync, spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, mkdirSync, cpSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { countLOC, estimateTokens, injectMatchaRules, checkTool } from "./bench-utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPOS_DIR = join(__dirname, "repos");
const TASKS_PATH = join(__dirname, "repo-tasks.json");
const BENCH_SCRIPT = join(__dirname, "matcha-bench.js");

// ─── Arms ──────────────────────────────────────────────────────────────────

const ARMS = [
  {
    id: "baseline",
    label: "No rules",
    desc: "Claude Code without matcha conventions",
    injectMatcha: false,
    promptSuffix: "",
  },
  {
    id: "terse",
    label: "Terse prompt",
    desc: "Claude Code instructed to be brief",
    injectMatcha: false,
    promptSuffix: "\n\nIMPORTANT: Be brief. Write minimal working code. No comments. Short variable names OK.",
  },
  {
    id: "matcha",
    label: "matcha rules",
    desc: "Claude Code with matcha conventions injected",
    injectMatcha: true,
    promptSuffix: "",
  },
];


// ─── Backends ────────────────────────────────────────────────────────────────

const BACKENDS = {
  claude: {
    id: "claude",
    label: "Claude Code",
    check: () => {
      try {
        execSync("which claude 2>/dev/null || where claude 2>nul", { stdio: "pipe", timeout: 5000, encoding: "utf-8" });
        return true;
      } catch { return false; }
    },
    spawn: (spec, cwd) => spawn("claude", ["--print", spec], { cwd, stdio: ["pipe", "pipe", "pipe"], shell: true }),
  },
  opencode: {
    id: "opencode",
    label: "OpenCode",
    check: () => {
      try {
        execSync("which opencode 2>/dev/null || where opencode 2>nul", { stdio: "pipe", timeout: 5000, encoding: "utf-8" });
        return true;
      } catch { return false; }
    },
    spawn: (spec, cwd) => {
      writeFileSync(join(cwd, "PROMPT.md"), spec, "utf-8");
      console.log("  ⚠️  OpenCode is interactive-only. PROMPT.md written to temp dir.");
      console.log("  ⚠️  Run: cd", cwd, "&& opencode");
      return null;
    },
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function cloneFixture(repoId, tmpDir) {
  const src = join(REPOS_DIR, repoId);
  if (!existsSync(src)) {
    throw new Error(`Repository fixture not found: ${repoId} (expected at ${src})`);
  }
  cpSync(src, tmpDir, { recursive: true });
}

// ─── Git diff measurements ────────────────────────────────────────────────

function measureChanges(dir) {
  try {
    const diffOutput = execSync('git diff --stat', {
      cwd: dir,
      encoding: "utf-8",
      timeout: 10_000,
    });
    const lines = diffOutput.trim().split("\n").filter(l => l.includes("|"));
    let addedLOC = 0;
    let changedFiles = [];

    for (const line of lines) {
      const match = line.match(/\|\s*(\d+)/);
      if (match) addedLOC += parseInt(match[1], 10);
      changedFiles.push(line.split("|")[0].trim());
    }

    // Count net added lines
    const numstat = execSync('git diff --numstat', {
      cwd: dir,
      encoding: "utf-8",
      timeout: 10_000,
    });
    let added = 0, deleted = 0;
    for (const line of numstat.trim().split("\n")) {
      const parts = line.split("\t");
      if (parts.length >= 2) {
        added += parseInt(parts[0]) || 0;
        deleted += parseInt(parts[1]) || 0;
      }
    }

    return { addedLOC, netLOC: added - deleted, totalChanged: added + deleted, changedFiles, added, deleted };
  } catch {
    return { addedLOC: 0, netLOC: 0, totalChanged: 0, changedFiles: [], added: 0, deleted: 0 };
  }
}

function runTests(dir) {
  try {
    const out = execSync("npm test 2>&1", {
      cwd: dir,
      encoding: "utf-8",
      timeout: 30_000,
      stdio: "pipe",
    });
    const passed = (out.match(/✓|\bPASS\b/g) || []).length;
    const failed = (out.match(/✕|\bFAIL\b/g) || []).length;
    return { passed, failed, output: out.slice(0, 500) };
  } catch (e) {
    const out = e.stdout || "";
    const passed = (out.match(/✓|\bPASS\b/g) || []).length;
    const failed = (out.match(/✕|\bFAIL\b/g) || []).length;
    return { passed, failed: failed || 1, output: out.slice(0, 500) };
  }
}

function runTestsWithRegression(dir) {
  let beforeResults = null;
  try {
    const before = execSync("npm test 2>&1", { cwd: dir, encoding: "utf-8", timeout: 30_000, stdio: "pipe" });
    const beforeFail = (before.match(/FAIL|✕/g) || []).length;
    beforeResults = { failedCount: beforeFail, output: before, hasFailed: beforeFail > 0 };
  } catch (e) {
    beforeResults = { failedCount: -1, output: e.stdout || "", hasFailed: true };
  }

  let afterResults = null;
  try {
    const after = execSync("npm test 2>&1", { cwd: dir, encoding: "utf-8", timeout: 30_000, stdio: "pipe" });
    const afterFail = (after.match(/FAIL|✕/g) || []).length;
    afterResults = { passed: (after.match(/✓|PASS/g) || []).length, failed: afterFail, output: after.slice(0, 500), hasFailed: afterFail > 0 };
  } catch (e) {
    const out = e.stdout || "";
    afterResults = { passed: (out.match(/✓|PASS/g) || []).length, failed: (out.match(/FAIL|✕/g) || []).length || 1, output: out.slice(0, 500), hasFailed: true };
  }

  const failToPass = beforeResults.hasFailed && !afterResults.hasFailed;
  const passToPass = !afterResults.hasFailed;

  return { ...afterResults, failToPass, passToPass, failToPassCount: failToPass ? beforeResults.failedCount : 0, regressionCount: afterResults.failed };
}

function runComplianceScan(dir) {
  try {
    const out = execSync(`node "${BENCH_SCRIPT}" "${dir}" --json`, {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 15_000,
    });
    const result = JSON.parse(out);
    return { score: result.score, grade: result.grade, issues: result.totalIssues };
  } catch {
    return { score: 0, grade: "N/A", issues: -1 };
  }
}

// ─── Task runner ───────────────────────────────────────────────────────────

async function runRepoTasks(task, arm, options = {}) {
  const { backend = "claude", failToPass = true, ...rest } = options;
  const { simulate = false, keep = false, timeout = 120_000 } = options;
  const repoId = task.repo;
  const tmpDir = mkdtempSync(join(__dirname, ".repo-" + task.id + "-" + arm.id + "-"));

  const result = {
    task: task.id,
    taskName: task.name,
    repo: repoId,
    arm: arm.id,
    armLabel: arm.label,
    loc: 0,
    tokens: 0,
    addedLOC: 0,
    netLOC: 0,
    totalChanged: 0,
    testPassed: false,
    testFailed: 0,
    testPassedCount: 0,
    complianceScore: 0,
    complianceGrade: "N/A",
    error: null,
    tmpDir,
  };

  try {
    // Clone fixture into temp dir
    cloneFixture(repoId, tmpDir);

    // Init git for diff tracking
    try {
      execSync("git init && git add -A && git commit -m 'initial' --no-gpg-sign 2>&1", {
        cwd: tmpDir,
        encoding: "utf-8",
        timeout: 15_000,
        stdio: "pipe",
      });
    } catch {
      // git not available or already initialized — continue
    }

    // Install dependencies
    if (existsSync(join(tmpDir, "package.json"))) {
      try {
        execSync("npm install --no-audit --no-fund 2>&1", {
          cwd: tmpDir,
          encoding: "utf-8",
          timeout: 60_000,
          stdio: "pipe",
        });
      } catch (e) {
        // Install failure — non-fatal, tests may still work with pre-installed
      }
    }

    // Inject matcha rules for matcha arm
    if (arm.injectMatcha) {
      injectMatchaRules(tmpDir);
    }

    // Run spec
    const fullSpec = task.description + (arm.promptSuffix || "");

    if (simulate) {
      // Simulated mode: no Claude, just measure existing state
    } else {
      const claudeAvailable = checkTool("claude");
      if (!claudeAvailable) {
        throw new Error("Claude Code CLI not found. Install from: https://docs.anthropic.com/en/docs/claude-code/overview");
      }

      // Spawn Claude Code
      const child = spawn("claude", ["--print", fullSpec], {
        cwd: tmpDir,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      });

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          child.kill("SIGTERM");
          reject(new Error(`Timeout after ${timeout / 1000}s`));
        }, timeout);

        child.on("close", (code) => {
          clearTimeout(timer);
          resolve(code);
        });
        child.on("error", reject);
      });
    }

    // Measure changes
    const changes = measureChanges(tmpDir);
    result.addedLOC = changes.addedLOC;
    result.netLOC = changes.netLOC;
    result.totalChanged = changes.totalChanged;

    // Count LOC of new/changed files
    let totalLOC = 0;
    let totalTokens = 0;
    for (const file of changes.changedFiles) {
      const filePath = join(tmpDir, file);
      if (existsSync(filePath)) {
        const code = readFileSync(filePath, "utf-8");
        totalLOC += countLOC(code);
        totalTokens += estimateTokens(code);
      }
    }
    result.loc = totalLOC || changes.addedLOC;
    result.tokens = totalTokens || estimateTokens(String(totalLOC));

    // Run tests
    const testResult = runTestsWithRegression(tmpDir);
    result.testPassed = !testResult.hasFailed;
    result.testFailed = testResult.failed;
    result.testPassedCount = testResult.passed;
    result.testOutput = testResult.output;
    result.failToPass = testResult.failToPass;
    result.passToPass = testResult.passToPass;
    result.failToPassCount = testResult.failToPassCount;
    result.regressionCount = testResult.regressionCount;

    // Compliance scan
    const compliance = runComplianceScan(tmpDir);
    result.complianceScore = compliance.score;
    result.complianceGrade = compliance.grade;

  } catch (e) {
    result.error = e.message;
    result.testPassed = false;
  }

  // Cleanup unless --keep
  if (!keep) {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  return result;
}

// ─── Report formatting ────────────────────────────────────────────────────

function formatRepoReport(results, arms) {
  const armKeys = arms.map(a => a.id);

  // Group by arm
  const byArm = {};
  for (const a of armKeys) {
    byArm[a] = { tasks: 0, loc: 0, addedLOC: 0, testPassed: 0, complianceScore: 0 };
  }

  let output = "\n═══ Live Repo Benchmark ═══\n\n";

  for (const r of results) {
    const a = r.arm;
    byArm[a].tasks++;
    byArm[a].loc += r.loc;
    byArm[a].addedLOC += r.addedLOC;
    if (r.testPassed) byArm[a].testPassed++;
    byArm[a].complianceScore += r.complianceScore;

    const icon = r.testPassed ? "✅" : "❌";
    output += `${icon} ${r.taskName} × ${r.armLabel}\n`;
    output += `     LOC added: ${r.addedLOC}  |  Tests: ${r.testPassedCount}/${r.testPassedCount + r.testFailed}  |  Compliance: ${r.complianceScore} (${r.complianceGrade})\n`;
    if (r.error) output += `     Error: ${r.error}\n`;
    output += "\n";
  }

  // Summary
  output += "═══ Summary ═══\n";
  const header = armKeys.map(a => a.padStart(14)).join("  ");
  output += `${"".padEnd(16)}${header}\n`;

  for (const metric of ["loc", "addedLOC", "testPassed", "complianceScore"]) {
    const label = metric === "loc" ? "Total LOC:" : metric === "addedLOC" ? "Added LOC:" : metric === "testPassed" ? "Tests OK:" : "Compliance:";
    const row = armKeys.map(a => {
      const val = byArm[a][metric];
      const total = byArm[a].tasks;
      if (metric === "testPassed") return `${val}/${total}`.padStart(14);
      if (metric === "complianceScore" && total > 0) return `${Math.round(val / total)}`.padStart(14);
      return String(val).padStart(14);
    }).join("  ");
    output += `${label.padEnd(16)}${row}\n`;
  }

  // Cross-arm comparison (if baseline exists)
  const b = byArm["baseline"];
  if (b && b.loc > 0) {
    for (const a of armKeys) {
      if (a === "baseline") continue;
      const delta = b.loc - byArm[a].loc;
      if (delta > 0) {
        const pct = Math.round(delta / b.loc * 100);
        output += `\n  📐 ${a} vs baseline: -${delta} LOC (-${pct}%)`;
      }
    }
    output += "\n";
  }

  return output;
}

// ─── Load tasks ────────────────────────────────────────────────────────────

function loadTasks() {
  return JSON.parse(readFileSync(TASKS_PATH, "utf-8"));
}

// ─── Main orchestrator ─────────────────────────────────────────────────────

async function runLiveRepoBenchmark(options = {}) {
  const {
    arms = ARMS.map(a => a.id),
    tasks = null,
    simulate = false,
    keep = false,
    timeout = 120_000,
    backend = "claude",
  } = options;

  const selectedArms = ARMS.filter(a => !arms || arms.includes(a.id));
  const allTasks = loadTasks();
  const selectedTasks = tasks
    ? allTasks.filter(t => tasks.includes(t.id))
    : allTasks;

  const claudeAvailable = simulate ? false : checkTool("claude");

  console.log(`🍵 matcha: Live Repo Benchmark`);
  console.log(`Mode: ${simulate ? "SIMULATED" : claudeAvailable ? "LIVE (Claude Code detected)" : "FALLBACK (no Claude, using simulate)"}`);
  console.log(`Backend: ${BACKENDS[backend]?.label || backend}`);
  console.log(`${selectedArms.length} arm(s) × ${selectedTasks.length} task(s) on ${[...new Set(selectedTasks.map(t => t.repo))].join(", ")}\n`);

  if (!simulate && !claudeAvailable) {
    console.log("⚠️  Claude Code CLI not found. Falling back to simulated mode.\n");
  }

  const results = [];
  const actualSimulate = simulate || !claudeAvailable;

  for (const task of selectedTasks) {
    for (const arm of selectedArms) {
      process.stdout.write(`  ▶ ${task.name} × ${arm.label}... `);

      const result = await runRepoTasks(
        task, arm,
        { simulate: actualSimulate, keep, timeout, backend }
      );

      const icon = result.testPassed ? "✅" : "❌";
      process.stdout.write(`${icon} ${result.addedLOC} LOC added\n`);
      results.push(result);
    }
  }

  console.log(formatRepoReport(results, selectedArms));
  return results;
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\\\/g, "/").endsWith("live-repo-runner.js") ||
  process.argv[1].replace(/\\\\/g, "/").endsWith("live-repo-runner")
);

if (isDirectInvocation) {
  (async () => {
    const args = process.argv.slice(2);
    const armFilter = args.includes("--arm") ? args[args.indexOf("--arm") + 1]?.split(",") : null;
    const taskFilter = args.includes("--task") ? args[args.indexOf("--task") + 1]?.split(",") : null;
    const full = args.includes("--full");
    const backend = args.includes("--backend") ? args[args.indexOf("--backend") + 1] : "claude";
    const simulate = args.includes("--simulate");
    const keep = args.includes("--keep");
    const jsonFlag = args.includes("--json");

    const results = await runLiveRepoBenchmark({
      arms: full ? null : armFilter,
      tasks: full ? null : taskFilter,
      simulate,
      keep,
    });

    if (jsonFlag) {
      console.log(JSON.stringify(results, null, 2));
    }
  })();
}

export { runLiveRepoBenchmark, loadTasks, ARMS };
