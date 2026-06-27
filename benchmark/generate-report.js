#!/usr/bin/env node
/**
 * 🍵 matcha — generate-report.js
 * Runs all benchmark modes and writes results to docs/benchmark.json.
 *
 * Usage:
 *   node benchmark/generate-report.js              ← run + write JSON
 *   node benchmark/generate-report.js --json       ← JSON to stdout only
 *   node benchmark/generate-report.js --skip-bench  ← re-read existing results
 *
 * Matcha-style: one function per concern, no over-engineering.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BENCH_SCRIPT = join(__dirname, "matcha-bench.js");
const RESULT_PATH = join(ROOT, "docs", "benchmark.json");

// ─── 1. Run benchmark & parse JSON ────────────────────────────────────────

function runBenchmark(options = {}) {
  const iterations = options.iterations ?? 1;
  const itersFlag = iterations > 1 ? ` --iters ${iterations}` : "";
  console.log(`🍵 Running agentic benchmark (n=${iterations})...`);
  const out = execSync(`node "${BENCH_SCRIPT}" --agentic --json${itersFlag}`, {
    cwd: ROOT,
    encoding: "utf-8",
    timeout: 30_000,
  });
  return JSON.parse(out);
}

// ─── 2. Transform to BENCHMARK_DATA format ────────────────────────────────

function transformData(raw) {
  return raw.map(task => {
    const arms = {};
    for (const a of ["baseline", "matcha", "terse"]) {
      const d = task[a] || {};
      arms[a] = {
        loc: d.loc ?? 0,
        tokens: d.tokens ?? 0,
        correct: d.correct ?? false,
        adversarial: d.adversarial ?? false,
      };
    }
    return { id: task.id, name: task.name, ...arms };
  });
}

// ─── 3. Write result JSON ────────────────────────────────────────────────

function writeResults(data, totals, repoData) {
  const result = {
    generated: new Date().toISOString(),
    summary: {
      baseline: totals.baseline,
      terse: totals.terse,
      matcha: totals.matcha,
    },
    data,
    repo: repoData || [],
  };
  writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2), "utf-8");
  console.log(`  ✅ Results written to docs/benchmark.json`);
}

// ─── 4. Calculate summary ─────────────────────────────────────────────────

function calcSummary(data) {
  const totals = {};
  for (const a of ["baseline", "matcha", "terse"]) {
    totals[a] = { loc: 0, correct: 0, adversarial: 0, total: 0 };
  }
  for (const t of data) {
    for (const a of ["baseline", "matcha", "terse"]) {
      totals[a].loc += t[a]?.loc ?? 0;
      if (t[a]?.correct) totals[a].correct++;
      if (t[a]?.adversarial) totals[a].adversarial++;
      totals[a].total++;
    }
  }
  return totals;
}

// ─── 5. Run repo benchmark & inject ───────────────────────────────────────

function runRepoBenchmark() {
  console.log("📦 Running repo benchmark...");
  const out = execSync(`node "${join(__dirname, "live-repo-runner.js")}" --simulate --json`, {
    cwd: ROOT,
    encoding: "utf-8",
    timeout: 120_000,
  });
  return JSON.parse(out);
}

function formatRepoData(raw) {
  return raw.map(r => ({
    task: r.task, taskName: r.taskName,
    arm: r.arm, armLabel: r.armLabel,
    loc: r.loc ?? 0, addedLOC: r.addedLOC ?? 0,
    testPassed: !!r.testPassed,
    testFailed: r.testFailed ?? 0,
    testPassedCount: r.testPassedCount ?? 0,
    complianceScore: r.complianceScore ?? 0,
    complianceGrade: r.complianceGrade ?? "N/A",
  }));
}

// ─── 6. Print report ──────────────────────────────────────────────────────

function printReport(totals) {
  const b = totals.baseline;
  const m = totals.matcha;
  const t = totals.terse;
  const reduction = b.loc > 0 ? Math.round((1 - m.loc / b.loc) * 100) : 0;

  console.log(`\n📊 Report Generated: docs/index.html`);
  console.log(`─── Summary ───`);
  console.log(`  ${"".padEnd(12)} baseline   terse   matcha`);
  console.log(`  ${"LOC:".padEnd(12)} ${String(b.loc).padStart(5)}   ${String(t.loc).padStart(5)}   ${String(m.loc).padStart(5)}`);
  console.log(`  ${"Correct:".padEnd(12)} ${(b.correct+"/"+b.total).padStart(5)}   ${(t.correct+"/"+t.total).padStart(5)}   ${(m.correct+"/"+m.total).padStart(5)}`);
  console.log(`  ${"Adversarial:".padEnd(12)} ${(b.adversarial+"/"+b.total).padStart(5)}   ${(t.adversarial+"/"+t.total).padStart(5)}   ${(m.adversarial+"/"+m.total).padStart(5)}`);
  console.log(`\n  📐 matcha vs baseline: -${b.loc - m.loc} LOC (${reduction > 0 ? "-" : ""}${reduction}%)`);
  if (t.loc > m.loc) {
    console.log(`  🎯 matcha beats terse by ${t.loc - m.loc} LOC`);
  } else if (m.loc > t.loc) {
    console.log(`  ⚠️  terse beats matcha by ${m.loc - t.loc} LOC`);
  }
  console.log("");
}

// ─── 7. CLI entry ─────────────────────────────────────────────────────────

const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\/g, "/").endsWith("generate-report.js") ||
  process.argv[1].replace(/\\/g, "/").endsWith("generate-report")
);

if (isDirectInvocation) {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes("--json");
  const skipBench = args.includes("--skip-bench");
  const includeRepo = args.includes("--include-repo");
  const itersIndex = args.indexOf("--iters");
  const iterations = itersIndex >= 0 ? parseInt(args[itersIndex + 1], 10) || 4 : 1;

  if (skipBench) {
    if (!existsSync(RESULT_PATH)) {
      console.error("ERROR: docs/benchmark.json not found");
      process.exit(1);
    }
    const saved = JSON.parse(readFileSync(RESULT_PATH, "utf-8"));
    const totals = saved.summary;
    if (jsonOnly) {
      console.log(JSON.stringify(saved, null, 2));
    } else {
      printReport(totals);
    }
    process.exit(0);
  }

  // Full run
  try {
    console.log(`  🔄 ${iterations} iteration(s) per cell\n`);
    const raw = runBenchmark({ iterations });
    const data = transformData(raw);
    const totals = calcSummary(data);
    let repoData = [];

    if (includeRepo) {
      try {
        const repoRaw = runRepoBenchmark();
        repoData = formatRepoData(repoRaw);
        console.log(`  ✅ Repo benchmark collected (${repoRaw.length} runs)\n`);
      } catch (e) {
        console.log(`  ⚠️  Repo benchmark skipped: ${e.message}\n`);
      }
    }

    writeResults(data, totals, repoData);

    if (jsonOnly) {
      console.log(JSON.stringify({ data, totals, generated: new Date().toISOString(), iterations }, null, 2));
    } else {
      printReport(totals);
    }
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    process.exit(1);
  }
}

export { runBenchmark, transformData, calcSummary, printReport };
