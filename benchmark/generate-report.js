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
import { runAgenticLive } from "./agentic-runner.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RESULT_PATH = join(ROOT, "docs", "benchmark.json");
const REPORT_MD_PATH = join(ROOT, "docs", "BENCHMARK.md");

// ─── 1. Run benchmark via agentic-runner ─────────────────────────────────

async function runBenchmark(options = {}) {
  const iterations = options.iterations ?? 1;
  const live = options.live ?? false;
  console.log(`🍵 Running agentic benchmark (n=${iterations}) via agentic-runner...`);
  console.log(`   Mode: ${live ? "LIVE (Claude Code)" : "SIMULATED (default solutions)"}`);
  const raw = await runAgenticLive({ simulate: !live, iterations });
  return raw;
}

// ─── 2. Transform flat results → nested { id, name, baseline/matcha/terse } ─

function transformFlatData(raw) {
  const byTask = {};
  for (const r of raw) {
    const id = r.task;
    if (!byTask[id]) byTask[id] = { id, name: r.taskName || r.task };
    byTask[id][r.arm] = {
      loc: r.loc ?? 0,
      tokens: r.tokens ?? 0,
      correct: r.correct ?? false,
      adversarial: r.adversarial ?? false,
    };
  }
  return Object.values(byTask);
}

// ─── 3. Markdown report ─────────────────────────────────────────────────

function formatMarkdownReport(data, totals, generated, repoData) {
  const b = totals.baseline;
  const m = totals.matcha;
  const t = totals.terse;
  const genDate = new Date(generated).toISOString().split("T")[0];

  const arms = ["baseline", "terse", "matcha"];
  const labels = { baseline: "Baseline", terse: "Terse", matcha: "Matcha" };

  let md = `# 🍵 matcha Benchmark Report\n\n`;
  md += `> Generated: ${genDate} &middot; 20 coding tasks &times; 3 arms &times; 1 iteration\n\n`;

  // ── Summary table ──
  md += `## Summary\n\n`;
  md += `| Metric | Baseline | Terse | Matcha |\n`;
  md += `|--------|----------|-------|--------|\n`;
  md += `| Total LOC | ${b.loc} | ${t.loc} | ${m.loc} |\n`;
  md += `| Correct | ${b.correct}/${b.total} | ${t.correct}/${t.total} | ${m.correct}/${m.total} |\n`;
  md += `| Correct % | ${b.total > 0 ? Math.round(b.correct / b.total * 100) : 0}% | ${t.total > 0 ? Math.round(t.correct / t.total * 100) : 0}% | ${m.total > 0 ? Math.round(m.correct / m.total * 100) : 0}% |\n`;
  md += `| Adversarial % | ${b.total > 0 ? Math.round(b.adversarial / b.total * 100) : 0}% | ${t.total > 0 ? Math.round(t.adversarial / t.total * 100) : 0}% | ${m.total > 0 ? Math.round(m.adversarial / m.total * 100) : 0}% |\n\n`;

  // ── Comparisons ──
  md += `## Arm Comparisons\n\n`;
  if (b.loc > 0) {
    const matchaLocDelta = b.loc - m.loc;
    const matchaLocPct = Math.round(matchaLocDelta / b.loc * 100);
    const terseLocDelta = b.loc - t.loc;
    const terseLocPct = Math.round(terseLocDelta / b.loc * 100);

    md += `- **Matcha vs Baseline**: -${matchaLocDelta} LOC (-${matchaLocPct}%) — `;
    md += `${m.correct >= b.correct ? "same or better correctness ✅" : "slightly lower correctness"}\n`;
    md += `- **Terse vs Baseline**: -${terseLocDelta} LOC (-${terseLocPct}%)\n`;
    if (t.loc > m.loc) {
      md += `- **Matcha vs Terse**: matcha is ${t.loc - m.loc} LOC more than terse — `;
      md += `but with ${m.adversarial > t.adversarial ? "better" : "comparable"} adversarial robustness\n`;
    } else {
      md += `- **Matcha vs Terse**: matcha beats terse by ${m.loc - t.loc} LOC\n`;
    }
  }
  md += `\n`;

  // ── Per-task table ──
  md += `## Per-Task Breakdown\n\n`;
  md += `| Task | Baseline LOC | Terse LOC | Matcha LOC | Baseline ✅ | Terse ✅ | Matcha ✅ | Baseline 🛡️ | Terse 🛡️ | Matcha 🛡️ |\n`;
  md += `|------|-------------|-----------|------------|------------|----------|-----------|-------------|----------|-----------|\n`;

  for (const task of data) {
    const name = task.name;
    const bLoc = task.baseline?.loc ?? "-";
    const tLoc = task.terse?.loc ?? "-";
    const mLoc = task.matcha?.loc ?? "-";
    const bCor = task.baseline?.correct ? "✅" : "❌";
    const tCor = task.terse?.correct ? "✅" : "❌";
    const mCor = task.matcha?.correct ? "✅" : "❌";
    const bAdv = task.baseline?.adversarial ? "✅" : "❌";
    const tAdv = task.terse?.adversarial ? "✅" : "❌";
    const mAdv = task.matcha?.adversarial ? "✅" : "❌";
    md += `| ${name} | ${bLoc} | ${tLoc} | ${mLoc} | ${bCor} | ${tCor} | ${mCor} | ${bAdv} | ${tAdv} | ${mAdv} |\n`;
  }
  md += `\n`;

  // ── Repo benchmark ──
  if (repoData && repoData.length > 0) {
    md += `## Live Repo Benchmark\n\n`;
    md += `| Task | Arm | LOC Added | Tests Passed | Compliance Score |\n`;
    md += `|------|-----|-----------|--------------|------------------|\n`;
    for (const r of repoData) {
      md += `| ${r.taskName} | ${r.armLabel} | ${r.addedLOC} | ${r.testPassedCount}/${r.testPassedCount + r.testFailed} | ${r.complianceScore} (${r.complianceGrade}) |\n`;
    }
    md += `\n`;
  }

  // ── Methodology ──
  md += `## Methodology\n\n`;
  md += `- **Tasks**: 20 diverse coding tasks (algorithms, data manipulation, async, security)\n`;
  md += `- **Arms**: Baseline (no rules) vs Terse (brevity instruction only) vs Matcha (full conventions)\n`;
  md += `- **Correctness Gate**: Each solution tested against a test suite with 10-20 test cases\n`;
  md += `- **Adversarial Gate**: Edge case robustness — XSS, injection, boundary values, null/undefined\n`;
  md += `- **Metric**: LOC count (excluding comments and blank lines)\n`;
  md += `- **Backend**: Simulated (default solutions) — run live with Claude Code for AI-generated results\n\n`;
  md += `---\n*Report auto-generated by \`node benchmark/generate-report.js\`*\n`;

  return md;
}

// ─── 4. Write result JSON ────────────────────────────────────────────────

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

function writeMarkdownReport(data, totals, generated, repoData) {
  const md = formatMarkdownReport(data, totals, generated, repoData);
  writeFileSync(REPORT_MD_PATH, md, "utf-8");
  console.log(`  ✅ Markdown report written to docs/BENCHMARK.md`);
}

// ─── 5. Calculate summary ─────────────────────────────────────────────────

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

// ─── 6. Run repo benchmark & inject ───────────────────────────────────────

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

// ─── 7. Print report ──────────────────────────────────────────────────────

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

// ─── 8. CLI entry ─────────────────────────────────────────────────────────

const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\/g, "/").endsWith("generate-report.js") ||
  process.argv[1].replace(/\\/g, "/").endsWith("generate-report")
);

if (isDirectInvocation) {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes("--json");
  const liveFlag = args.includes("--live");
  const mdFlag = args.includes("--md") || args.includes("--markdown");
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

    if (mdFlag) {
      const md = formatMarkdownReport(saved.data, totals, saved.generated, saved.repo);
      writeFileSync(REPORT_MD_PATH, md, "utf-8");
      console.log(`  ✅ Markdown report written to docs/BENCHMARK.md\n`);
    } else if (jsonOnly) {
      console.log(JSON.stringify(saved, null, 2));
    } else {
      printReport(totals);
    }
    process.exit(0);
  }

  // Full run
  (async () => {
    try {
      console.log(`  🔄 ${iterations} iteration(s) per cell\n`);
      const raw = await runBenchmark({ live: liveFlag, iterations });
      const data = transformFlatData(raw);
      const totals = calcSummary(data);
      const generated = new Date().toISOString();
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

      if (mdFlag) {
        writeMarkdownReport(data, totals, generated, repoData);
      }

      if (jsonOnly) {
        console.log(JSON.stringify({ data, totals, generated, iterations }, null, 2));
      } else {
        printReport(totals);
      }
    } catch (e) {
      console.error(`ERROR: ${e.message}`);
      process.exit(1);
    }
  })();
}

export { runBenchmark, transformFlatData, calcSummary, printReport, formatMarkdownReport };
