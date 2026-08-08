#!/usr/bin/env node
/**
 * 🍵 matcha — live-bench.js
 * Live agentic benchmark on a real repo fixture using headless `opencode run --format json`.
 *
 * Unlike live-repo-runner.js (which measured output only), this runner also measures
 * PROCESS cost straight from the provider: real tokens (input+output+reasoning) and
 * cost reported in `step_finish` events, wall-clock time, and LLM round-trip count.
 *
 * Arms: baseline (no rules) / terse (brief prompt) / matcha (full rules injected in
 * opencode format: .opencode/ + .agents/ + hooks/ + AGENTS.md).
 *
 * Metrics per run:
 *   correctness  — failing tests that became passing (failToPass), and passed/failed counts
 *   loc          — git diff --numstat added/deleted lines
 *   tokens       — real provider tokens (sum of step_finish.tokens), cost in $ (may be 0 on free models)
 *   steps        — LLM round-trips (step_finish count)
 *   durationMs   — wall clock
 *   compliance   — matcha-bench score of the resulting code
 *
 * Usage:
 *   node benchmark/live-bench.js --arm matcha --out /tmp/bench-matcha.json
 *   node benchmark/live-bench.js --all --n 2 --keep
 *   node benchmark/live-bench.js --task add-rate-limiting --arm baseline
 */

import { spawn, execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, cpSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { injectOpenCodeRules, injectMatchaRules, injectOpenCodeRulesLite } from "./bench-utils.js";
import { scanFile, calculateScore } from "./matcha-bench.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPOS_DIR = join(__dirname, "repos");
const TASKS_PATH = join(__dirname, "repo-tasks.json");

const DEBUG = process.argv.includes("--debug");
const DEBUG_LOG = "/tmp/live-bench-events.jsonl";

const ARMS = {
  baseline: { id: "baseline", label: "No rules", inject: null, promptSuffix: "" },
  terse: {
    id: "terse",
    label: "Terse prompt",
    inject: null,
    promptSuffix: "\n\nIMPORTANT: Be brief. Write minimal working code. No comments. Short variable names OK.",
  },
  matcha: { id: "matcha", label: "matcha rules", inject: "opencode", promptSuffix: "" },
  // A/B arm for the standing-context fix: full opencode-format injection, but the
  // skill is stripped to core.md only. Measures how much of matcha's token overhead
  // comes from the non-core modules (engineering/risk/modes/legacy).
  "matcha-lite": { id: "matcha-lite", label: "matcha core-only", inject: "opencode-lite", promptSuffix: "" },
};

// ─── Shell helpers (explicit errors, matcha-style) ─────────────────────────

function run(cmd, cwd, timeoutMs = 60_000) {
  try {
    const out = execSync(cmd, { cwd, encoding: "utf-8", timeout: timeoutMs, stdio: "pipe" });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || "") + (e.stderr || "") };
  }
}

async function gitInit(dir) {
  await run("git init -q && git add -A && git -c user.email=bench@matcha -c user.name=bench commit -qm init", dir, 15_000);
}

async function installDeps(dir, cacheDir) {
  // Fast path: copy a pre-installed node_modules cache, else npm install.
  if (cacheDir && existsSync(join(cacheDir, "node_modules"))) {
    try {
      cpSync(join(cacheDir, "node_modules"), join(dir, "node_modules"), { recursive: true, force: true });
      return;
    } catch {}
  }
  await run("npm install --no-audit --no-fund --silent", dir, 120_000);
}

async function runTests(dir) {
  const res = await run("npm test 2>&1", dir, 60_000);
  const out = res.out;
  const failed = (out.match(/\bFAIL\b|✕/g) || []).length;
  const passed = (out.match(/\bPASS\b|✓/g) || []).length;
  // Per-suite pass detection for expectedPass targets (e.g. "PASS tests/activity.test.js")
  // jest prints: PASS|FAIL  <relative path>
  const suites = {};
  for (const line of out.split("\n")) {
    const m = line.match(/^(PASS|FAIL)\s+([^\s(]+)/);
    if (m) suites[m[2]] = m[1] === "PASS";
  }
  return { ok: res.ok, failed, passed, suites, out: out.slice(0, 600) };
}

/**
 * Check whether a task's expectedPass suites are green in a test output.
 * Returns { allPass, failing } — correctness signal scoped to the feature
 * being implemented (the fixture also contains unrelated failing suites).
 */
function checkExpectedPass(task, testResult) {
  const failing = (task.expectedPass || []).filter((f) => testResult.suites[f] === false);
  const present = (task.expectedPass || []).filter((f) => testResult.suites[f] !== undefined);
  return { allPass: present.length > 0 && failing.length === 0, failing };
}

function measureChanges(dir) {
  try {
    const numstat = execSync("git diff --numstat", { cwd: dir, encoding: "utf-8", timeout: 10_000 });
    let added = 0, deleted = 0;
    for (const line of numstat.trim().split("\n")) {
      if (!line.trim()) continue;
      const [a, d] = line.split("\t");
      added += parseInt(a) || 0;
      deleted += parseInt(d) || 0;
    }
    return { added, deleted, total: added + deleted };
  } catch {
    return { added: 0, deleted: 0, total: 0 };
  }
}

async function runCompliance(dir) {
  // Score ONLY the files the agent changed, never the whole fixture:
  // matcha arms inject hooks/ + rules dirs full of console.log/etc that would
  // drag the score to ~0 regardless of the code the agent actually wrote.
  try {
    // `git status --porcelain` catches BOTH modified ( M) and new (??) files,
    // whereas `git diff --name-only` misses untracked files the agent created.
    const porcelain = execSync("git status --porcelain", { cwd: dir, encoding: "utf-8", timeout: 10_000 });
    const changed = porcelain.split("\n")
      .map((l) => l.slice(3).trim())
      .filter(Boolean)
      .filter((f) => !f.startsWith(".gitignore"));
    const srcFiles = changed.filter((f) => /\.(js|ts|jsx|tsx|py|go|java|php)$/.test(f));
    // Agent wrote nothing → score is meaningless; mark N/A so the report never
    // conflates "no code written" with "clean code".
    if (!srcFiles.length) return { score: null, grade: "N/A (no changes)", issues: 0, files: 0 };
    const findings = [];
    for (const f of srcFiles) {
      const ff = scanFile(join(dir, f));
      if (ff) findings.push(...ff.map((x) => ({ ...x, file: f })));
    }
    const critical = findings.filter((f) => f.severity === "critical").length;
    const { score, grade } = calculateScore(findings.length, critical, srcFiles.length);
    return { score, grade, issues: findings.length, critical, files: srcFiles.length };
  } catch {
    return { score: null, grade: "N/A (error)", issues: -1, files: -1 };
  }
}

// ─── opencode runner (headless, JSONL events) ───────────────────────────────

function runOpenCode(spec, cwd, timeoutMs) {
  return new Promise((resolve) => {
    // CRITICAL: opencode ignores the Node-spawn `cwd` and resolves its own project
    // root from the parent process (verified: agent replied with the matcha repo
    // path while cwd was a /var/folders temp dir). Use the explicit `--dir` flag,
    // which is the supported way to pin the working directory.
    const child = spawn("opencode", ["run", spec, "--format", "json", "--dir", cwd], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let done = false;

    const tokens = { input: 0, output: 0, reasoning: 0, total: 0, cacheRead: 0, cacheWrite: 0 };
    let cost = 0;
    let steps = 0;
    let textOut = "";

    const finish = (status, error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ status, error, tokens, cost, steps, textOut, stdoutLen: stdout.length, stderr: stderr.slice(0, 300) });
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish("timeout", `Timeout after ${Math.round(timeoutMs / 1000)}s`);
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      // Stream-parse JSONL lines
      let nl;
      while ((nl = stdout.indexOf("\n")) !== -1) {
        const line = stdout.slice(0, nl).trim();
        stdout = stdout.slice(nl + 1);
        if (!line.startsWith("{")) continue;
        try {
          const ev = JSON.parse(line);
          if (DEBUG) {
            try { writeFileSync(DEBUG_LOG, JSON.stringify(ev) + "\n", { flag: "a" }); } catch {}
          }
          if (ev.type === "step_finish" && ev.part && ev.part.tokens) {
            const t = ev.part.tokens;
            tokens.input += t.input || 0;
            tokens.output += t.output || 0;
            tokens.reasoning += t.reasoning || 0;
            tokens.cacheRead += (t.cache && t.cache.read) || 0;
            tokens.cacheWrite += (t.cache && t.cache.write) || 0;
            tokens.total += t.total || 0;
            steps++;
          }
          if (ev.type === "step_finish") cost += ev.part.cost || 0;
          if (ev.type === "text" && ev.part && ev.part.text) textOut += ev.part.text;
        } catch {}
      }
    });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (e) => finish("error", e.message));
    child.on("close", (code) => finish(code === 0 ? "ok" : `exit-${code}`, null));
  });
}

// ─── Cell runner ─────────────────────────────────────────────────────────────

async function runCell(task, arm, iter, opts) {
  const { keep, timeoutMs, nodeModulesCache } = opts;
  // CRITICAL: fixtures must live OUTSIDE the matcha repo. opencode walks up from cwd
  // to find config; a dir under benchmark/ inherits the matcha repo's own .opencode/
  // + planning gate (enforce) and silently blocks every non-trivial edit — which also
  // contaminated the baseline arm with matcha rules, invalidating the comparison.
  const tmpDir = mkdtempSync(join(tmpdir(), `matcha-bench-${task.id}-${arm.id}-${iter}-`));
  const result = {
    task: task.id,
    taskName: task.name,
    arm: arm.id,
    iter,
    error: null,
    status: null,
    added: 0,
    deleted: 0,
    totalChanged: 0,
    beforeFailed: -1,
    afterFailed: -1,
    failToPass: 0,
    passed: 0,
    testOk: false,
    expectedPassOk: false,
    expectedPassFailing: [],
    tokensIn: 0,
    tokensOut: 0,
    tokensReasoning: 0,
    tokensTotal: 0,
    cacheRead: 0,
    costUsd: 0,
    steps: 0,
    durationMs: 0,
    complianceScore: null,
    complianceGrade: "N/A",
    complianceFiles: -1,
    // Quality metrics (benchmark v3 — QUALITY over cost):
    // anti-pattern findings in the agent-written code (from scanFile) and
    // defect density = findings per 100 LOC the agent added. Lower is better.
    // Baseline agents write few, sloppy LOC; matcha writes more, cleaner LOC —
    // density is the apples-to-apples quality metric, not raw token counts.
    qualityIssues: 0,
    qualityCritical: 0,
    defectDensity: null,
  };

  try {
    // Fresh fixture copy
    cpSync(join(REPOS_DIR, task.repo), tmpDir, { recursive: true });

    // Isolate dependencies + lockfiles from git so the initial commit is fast
    // (node_modules = thousands of files would blow the 15s gitInit timeout)
    writeFileSync(join(tmpDir, ".gitignore"), "node_modules/\npackage-lock.json\n", "utf-8");

    // Install deps BEFORE the baseline test (before-count must measure real failures)
    await installDeps(tmpDir, nodeModulesCache);

    // Baseline test state BEFORE agent (deps present → real failing tests)
    const before = await runTests(tmpDir);
    result.beforeFailed = before.failed;

    // Inject matcha for the matcha arms
    if (arm.inject === "opencode") injectOpenCodeRules(tmpDir);
    else if (arm.inject === "opencode-lite") injectOpenCodeRulesLite(tmpDir);
    else if (arm.inject === "claude") injectMatchaRules(tmpDir);

    // Init git AFTER deps + injection so rule/dep files are not counted as agent changes
    await gitInit(tmpDir);

    // Run the agent
    const spec = task.description + arm.promptSuffix;
    const start = Date.now();
    const res = await runOpenCode(spec, tmpDir, timeoutMs);
    result.durationMs = Date.now() - start;
    result.status = res.status;
    result.tokensIn = res.tokens.input;
    result.tokensOut = res.tokens.output;
    result.tokensReasoning = res.tokens.reasoning;
    result.tokensTotal = res.tokens.total;
    result.cacheRead = res.tokens.cacheRead;
    result.costUsd = res.cost;
    result.steps = res.steps;

    if (res.status !== "ok") {
      result.error = res.error || `opencode status: ${res.status}`;
      throw new Error(result.error);
    }

    // Measure AFTER state
    const changes = measureChanges(tmpDir);
    result.added = changes.added;
    result.deleted = changes.deleted;
    result.totalChanged = changes.total;

    const after = await runTests(tmpDir);
    result.afterFailed = after.failed;
    result.passed = after.passed;
    result.testOk = after.ok && after.failed === 0;
    result.failToPass = Math.max(0, result.beforeFailed - result.afterFailed);
    const ep = checkExpectedPass(task, after);
    result.expectedPassOk = ep.allPass;
    result.expectedPassFailing = ep.failing;

    const comp = await runCompliance(tmpDir);
    result.complianceScore = comp.score;
    result.complianceGrade = comp.grade;
    result.complianceFiles = comp.files;
    // Quality: anti-pattern findings per 100 added LOC. Scored only on files the
    // agent wrote/changed (same set runCompliance scans) so fixture noise never
    // dilutes it. N/A when the agent wrote no source (density undefined).
    result.qualityIssues = comp.issues >= 0 ? comp.issues : 0;
    result.qualityCritical = comp.critical >= 0 ? comp.critical : 0;
    // Density = source findings per 100 LOC ADDED. `added` is all-file numstat;
    // an agent that also writes tests dilutes the denominator slightly — accepted
    // for the fixture (agents write source only), noted for metric defensibility.
    result.defectDensity = result.added > 0 && comp.issues >= 0
      ? Number(((comp.issues / result.added) * 100).toFixed(1))
      : null;
  } catch (e) {
    if (!result.error) result.error = e.message;
  }

  if (!keep) {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
  return result;
}

// ─── Aggregation (median + stdev) ────────────────────────────────────────────

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function stdev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (arr.length - 1));
}

function summarize(results) {
  const byArm = {};
  for (const armId of Object.keys(ARMS)) {
    const runs = results.filter((r) => r.arm === armId);
    if (!runs.length) continue;
    const ok = runs.filter((r) => r.status === "ok");
    byArm[armId] = {
      runs: runs.length,
      completed: ok.length,
      timeout: runs.filter((r) => r.status === "timeout").length,
      error: runs.filter((r) => r.status && r.status !== "ok" && r.status !== "timeout").length,
      correctness: {
        failToPassTotal: ok.reduce((a, r) => a + r.failToPass, 0),
        fullyGreen: ok.filter((r) => r.testOk).length,
        avgFailToPass: median(ok.map((r) => r.failToPass)),
        expectedPassOk: ok.filter((r) => r.expectedPassOk).length,
      },
      loc: { addedMedian: median(ok.map((r) => r.added)), addedStdev: stdev(ok.map((r) => r.added)) },
      tokens: {
        inMedian: median(ok.map((r) => r.tokensIn)),
        outMedian: median(ok.map((r) => r.tokensOut)),
        totalMedian: median(ok.map((r) => r.tokensTotal)),
        inStdev: stdev(ok.map((r) => r.tokensIn)),
      },
      steps: { median: median(ok.map((r) => r.steps)), stdev: stdev(ok.map((r) => r.steps)) },
      durationMs: { median: median(ok.map((r) => r.durationMs)), stdev: stdev(ok.map((r) => r.durationMs)) },
      compliance: {
        // Score is null when the agent wrote no source files (N/A) — exclude
        // those runs from the median so "nothing written" never inflates it.
        median: median(ok.map((r) => r.complianceScore).filter((s) => s != null)),
        stdev: stdev(ok.map((r) => r.complianceScore).filter((s) => s != null)),
        scoredRuns: ok.filter((r) => r.complianceScore != null).length,
        naRuns: ok.filter((r) => r.complianceScore == null).length,
      },
      quality: {
        // QUALITY metric (v3): defect density = anti-pattern findings per 100
        // added LOC, median over runs that wrote code. Lower is better. This is
        // the value side of the value/cost ledger — it is WHY matcha's extra
        // tokens/time can be a good trade. N/A runs (no source written) excluded.
        defectDensityMedian: median(ok.map((r) => r.defectDensity).filter((v) => v != null)),
        issuesMedian: median(ok.map((r) => r.qualityIssues)),
        criticalMedian: median(ok.map((r) => r.qualityCritical)),
        scoredRuns: ok.filter((r) => r.defectDensity != null).length,
      },
      costUsd: { median: median(ok.map((r) => r.costUsd)) },
    };
  }
  return byArm;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const armArg = args.includes("--arm") ? args[args.indexOf("--arm") + 1] : null;
  const taskArg = args.includes("--task") ? args[args.indexOf("--task") + 1] : null;
  const outPath = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
  const n = parseInt(args.includes("--n") ? args[args.indexOf("--n") + 1] : "2", 10);
  const keep = args.includes("--keep");
  const all = args.includes("--all");
  // Default 300s: complex multi-file tasks (refactor-users-service, fix-auth-security)
  // measured 160-200s+ on the free model — a 180s default would timeout them every
  // cell and invalidate the headline --all run.
  const timeoutMs = parseInt(args.includes("--timeout") ? args[args.indexOf("--timeout") + 1] : "300", 10) * 1000;

  const tasks = JSON.parse(readFileSync(TASKS_PATH, "utf-8")).filter((t) => !taskArg || t.id === taskArg);
  // Production arms for --all; matcha-lite is an experiment arm and must be
  // requested explicitly via --arm matcha-lite (keeps --all at 3 arms / 18 cells).
  const PROD_ARMS = ["baseline", "terse", "matcha"];
  const arms = all
    ? PROD_ARMS.map((id) => ARMS[id]).filter(Boolean)
    : armArg ? [ARMS[armArg]].filter(Boolean) : [ARMS.matcha];

  if (!arms.length) { console.error("Unknown arm. Use: baseline | terse | matcha | matcha-lite | --all"); process.exit(1); }

  // node_modules cache for fast installs
  const cacheDir = join("/tmp", "bench-nm-cache");
  try {
    mkdirSync(join(cacheDir, "express-api"), { recursive: true });
    cpSync(join(REPOS_DIR, "express-api"), join(cacheDir, "express-api"), { recursive: true, force: true });
    if (!existsSync(join(cacheDir, "express-api", "node_modules"))) {
      process.stdout.write("Pre-warming node_modules cache...\n");
      await run("npm install --no-audit --no-fund --silent", join(cacheDir, "express-api"), 180_000);
    }
  } catch {}

  const results = [];
  const total = tasks.length * arms.length * n;
  let i = 0;

  // Incremental save: write the payload after EVERY cell so a timeout/kill mid-run
  // never loses completed runs (long benchmark = ~90s per cell).
  const save = () => {
    if (!outPath) return;
    const summary = summarize(results);
    writeFileSync(outPath, JSON.stringify({
      generated: new Date().toISOString(),
      runner: "live-bench.js",
      backend: "opencode headless (--format json)",
      model: "default (see step_finish events)",
      arms: Object.values(ARMS).map((a) => ({ id: a.id, label: a.label })),
      n,
      timeoutMs,
      summary,
      results,
      partial: true,
    }, null, 2), "utf-8");
  };

  for (const task of tasks) {
    for (const arm of arms) {
      for (let it = 0; it < n; it++) {
        i++;
        process.stdout.write(`  [${i}/${total}] ${task.name} × ${arm.label} #${it + 1}... `);
        const r = await runCell(task, arm, it, { keep, timeoutMs, nodeModulesCache: join(cacheDir, task.repo) });
        const icon = r.status === "ok" ? "✅" : r.status === "timeout" ? "⏱️" : "❌";
        const okBit = r.status === "ok" ? ` ftp:${r.failToPass} +${r.added}L tok:${r.tokensTotal} steps:${r.steps} ${(r.durationMs / 1000).toFixed(0)}s` : ` ${r.error || r.status}`;
        process.stdout.write(`${icon}${okBit}\n`);
        results.push(r);
        save();
      }
    }
  }

  const summary = summarize(results);
  if (outPath) {
    writeFileSync(outPath, JSON.stringify({
      generated: new Date().toISOString(),
      runner: "live-bench.js",
      backend: "opencode headless (--format json)",
      model: "default (see step_finish events)",
      arms: Object.values(ARMS).map((a) => ({ id: a.id, label: a.label })),
      n,
      timeoutMs,
      summary,
      results,
    }, null, 2), "utf-8");
    console.log(`\n📄 Saved: ${outPath}`);
  } else {
    console.log(JSON.stringify(summary, null, 2));
  }
}

const isDirect = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("live-bench.js");
if (isDirect) {
  main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
}

export { runCell, summarize, ARMS };
