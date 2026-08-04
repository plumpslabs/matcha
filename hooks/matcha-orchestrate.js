#!/usr/bin/env node
/**
 * 🍵 matcha — matcha-orchestrate.js
 * Auto-chain agents for large tasks: Scout → Planner → Executor → Reviewer → Verifier
 *
 * Usage:
 *   node hooks/matcha-orchestrate.js "implement user auth module"
 *   node hooks/matcha-orchestrate.js --batch-size 10 --risk L2 "refactor core"
 *
 * Reads task from args, scans codebase, generates orchestration plan.
 *
 * Matcha-style: deterministic, fast, no dependencies.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname, relative } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const AGENTS_DIR = join(ROOT, ".agents");
const PLAN_DIR = join(AGENTS_DIR, "plan");

// ─── Config ──────────────────────────────────────────────────────────────────

const BATCH_SIZES = {
  small: 5,    // < 1k LOC
  medium: 10,  // 1k-10k LOC
  large: 20,   // 10k-100k LOC
  xlarge: 10,  // > 100k LOC (smaller batches for safety)
};

const RISK_THRESHOLDS = {
  L0: { review: false, test: false, checkpoint: false },
  L1: { review: false, test: true, checkpoint: false },
  L2: { review: true, test: true, checkpoint: true },
  L3: { review: true, test: true, checkpoint: true, expertRequired: true },
};

// ─── Codebase Analysis ───────────────────────────────────────────────────────

function scanCodebase() {
  let totalFiles = 0;
  let totalLOC = 0;
  const languages = {};
  const highRiskFiles = [];

  try {
    // Count files by language
    const output = execSync(
      `find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' | head -500`,
      { cwd: ROOT, timeout: 5000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );

    const files = output.trim().split("\n").filter(Boolean);
    totalFiles = files.length;

    for (const file of files) {
      const ext = file.split(".").pop()?.toLowerCase();
      if (ext) {
        languages[ext] = (languages[ext] || 0) + 1;
      }
    }

    // Count LOC
    try {
      const locOutput = execSync(
        `find . -type f -name '*.js' -o -name '*.ts' -o -name '*.jsx' -o -name '*.tsx' -o -name '*.py' -o -name '*.go' -o -name '*.rs' | grep -v node_modules | grep -v .git | xargs wc -l 2>/dev/null | tail -1`,
        { cwd: ROOT, timeout: 10000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
      );
      const locMatch = locOutput.match(/(\d+)\s+total/);
      totalLOC = locMatch ? parseInt(locMatch[1]) : 0;
    } catch {}

    // Find high-risk files
    try {
      const riskOutput = execSync(
        `grep -rl '\\b(password\\|token\\|secret\\|encrypt\\|auth\\|payment)\\b' --include='*.js' --include='*.ts' --include='*.py' --include='*.go' . 2>/dev/null | grep -v node_modules | grep -v .git | head -20`,
        { cwd: ROOT, timeout: 5000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
      );
      highRiskFiles.push(...riskOutput.trim().split("\n").filter(Boolean));
    } catch {}

  } catch {}

  return { totalFiles, totalLOC, languages, highRiskFiles };
}

// ─── Task Analysis ───────────────────────────────────────────────────────────

function analyzeTask(taskDescription) {
  const lower = taskDescription.toLowerCase();

  // Detect risk level from task description
  let riskLevel = "L2"; // default
  if (/\b(auth|login|password|token|secret|payment|crypto)\b/.test(lower)) {
    riskLevel = "L3";
  } else if (/\b(test|fixture|mock|doc|readme|comment)\b/.test(lower)) {
    riskLevel = "L1";
  } else if (/\b(tmp|temp|scratch|debug)\b/.test(lower)) {
    riskLevel = "L0";
  }

  // Detect task type
  let taskType = "implement";
  if (/\b(refactor|restructure|reorganize|move|rename)\b/.test(lower)) taskType = "refactor";
  if (/\b(fix|bug|error|patch|hotfix)\b/.test(lower)) taskType = "fix";
  if (/\b(add|create|new|implement|build|feature)\b/.test(lower)) taskType = "implement";
  if (/\b(remove|delete|clean|strip)\b/.test(lower)) taskType = "cleanup";

  // Estimate scope
  let scope = "medium";
  if (/\b(small|tiny|quick|simple|single|one file)\b/.test(lower)) scope = "small";
  if (/\b(large|big|major|full|complete|entire|all)\b/.test(lower)) scope = "large";
  if (/\b(huge|massive|huge|massive|enterprise)\b/.test(lower)) scope = "xlarge";

  return { riskLevel, taskType, scope };
}

// ─── Generate Orchestration Plan ─────────────────────────────────────────────

function generatePlan(taskDescription, codebase, taskAnalysis) {
  const { riskLevel, taskType, scope } = taskAnalysis;
  const batchSize = BATCH_SIZES[scope] || BATCH_SIZES.medium;
  const riskConfig = RISK_THRESHOLDS[riskLevel];

  const plan = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    task: taskDescription,
    analysis: {
      riskLevel,
      taskType,
      scope,
      batchSize,
      estimatedBatches: Math.ceil(codebase.totalFiles / batchSize),
    },
    codebase: {
      totalFiles: codebase.totalFiles,
      totalLOC: codebase.totalLOC,
      languages: codebase.languages,
      highRiskFiles: codebase.highRiskFiles,
    },
    chain: [],
    riskConfig,
  };

  // Scout phase
  plan.chain.push({
    phase: "scout",
    agent: "matcha-finder",
    description: "Explore codebase, find dependencies, map architecture",
    tools: ["read", "grep", "glob"],
    canWrite: false,
    estimatedTime: "2-5 min",
    checklist: [
      "Map affected files and their dependencies",
      "Identify high-risk files (auth, payments, DB)",
      "Check for existing code that handles similar logic",
      "Report dependency graph",
    ],
  });

  // Planner phase
  plan.chain.push({
    phase: "planner",
    agent: "matcha-planner",
    description: "Create 5W1H plan, file-by-file, step-by-step",
    tools: ["read", "grep", "glob", "write"],
    canWrite: true,
    writeTarget: ".agents/matcha-plan.md",
    estimatedTime: "3-8 min",
    checklist: [
      "Answer 5W1H with evidence",
      "Reuse check — found existing code?",
      "Stack audit — overlap detection",
      "Plan file-by-file with risk per step",
      "Identify simpler path",
    ],
    output: `<matcha_gate>\n  <what>...</what>\n  <why>...</why>\n  <how>...</how>\n</matcha_gate>`,
  });

  // Executor phase
  const batches = [];
  const totalBatches = Math.ceil(codebase.totalFiles / batchSize);
  for (let i = 0; i < Math.min(totalBatches, 10); i++) {
    batches.push({
      batch: i + 1,
      files: `${i * batchSize + 1}-${Math.min((i + 1) * batchSize, codebase.totalFiles)}`,
      checkpoint: riskConfig.checkpoint,
      test: riskConfig.test,
    });
  }

  plan.chain.push({
    phase: "executor",
    agent: "matcha-executor",
    description: "Implement plan, file-by-file, batch by batch",
    tools: ["read", "write", "edit", "bash"],
    canWrite: true,
    estimatedTime: `${totalBatches * 3}-${totalBatches * 8} min`,
    batchSize,
    batches,
    rules: [
      "One file at a time within each batch",
      "Run tests after each batch (if riskConfig.test)",
      "Git checkpoint after each successful batch (if riskConfig.checkpoint)",
      "STOP if tests fail — don't proceed to next batch",
      "Log decisions for each file change",
    ],
  });

  // Reviewer phase
  plan.chain.push({
    phase: "reviewer",
    agent: "matcha-reviewer",
    description: "Review all changes, 8-category risk-based review",
    tools: ["read", "grep", "glob"],
    canWrite: false,
    estimatedTime: "5-15 min",
    riskLevel,
    checklist: riskConfig.expertRequired
      ? [
          "All L2 checks (8 categories)",
          "Threat model documented",
          "Input validation at every boundary",
          "No secrets in code/logs/errors",
          "Parameterized queries only",
          "Rollback plan for destructive changes",
          "Domain expert sign-off required",
        ]
      : [
          "Correctness — logic, edge cases, race conditions",
          "Performance — O(n²+), N+1, re-render loops",
          "Security — injection, secrets, auth bypass",
          "Architecture — god objects, circular deps",
          "Errors — empty catches, missing paths",
          "Quality — duplication, magic numbers",
          "Testing — coverage, edge cases",
          "Maintainability — WHY comments, env vars",
        ],
    verdict: riskConfig.expertRequired ? "EXPERT_REQUIRED" : "BLOCK / PASS_WITH_FIXES / PASS",
  });

  // Verifier phase
  plan.chain.push({
    phase: "verifier",
    agent: "matcha-verifier",
    description: "Run tests, typecheck, lint — final verification",
    tools: ["bash"],
    canWrite: false,
    estimatedTime: "2-5 min",
    checklist: [
      "Run test suite — all must pass",
      "Typecheck — no errors",
      "Lint — clean",
      "Build — succeeds",
      "Coverage — no regression",
    ],
  });

  return plan;
}

// ─── Format Output ───────────────────────────────────────────────────────────

function formatPlan(plan) {
  let msg = `🍵 matcha: orchestration plan\n\n`;

  msg += `📋 Task: ${plan.task}\n`;
  msg += `📊 Risk: ${plan.analysis.riskLevel} | Type: ${plan.analysis.taskType} | Scope: ${plan.analysis.scope}\n`;
  msg += `📦 Batch size: ${plan.analysis.batchSize} files | Estimated batches: ${plan.analysis.estimatedBatches}\n\n`;

  msg += `🔗 Agent Chain:\n`;
  for (const phase of plan.chain) {
    const icon = phase.canWrite ? "✏️" : "👁️";
    msg += `  ${icon} ${phase.phase} (${phase.agent})\n`;
    msg += `     ${phase.description}\n`;
    msg += `     Est: ${phase.estimatedTime}\n`;
    if (phase.checklist) {
      msg += `     Checklist: ${phase.checklist.length} items\n`;
    }
    msg += `\n`;
  }

  if (plan.analysis.riskLevel === "L3") {
    msg += `🔴 L3 RISK: Expert review required. Cannot auto-pass.\n\n`;
  }

  msg += `⚠️ matcha: review this plan before executing.`;
  return msg;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(taskDescription) {
  if (!taskDescription) {
    console.log("Usage: node hooks/matcha-orchestrate.js <task description>");
    console.log("Example: node hooks/matcha-orchestrate.js 'implement user auth module'");
    process.exit(1);
  }

  // Scan codebase
  const codebase = scanCodebase();

  // Analyze task
  const taskAnalysis = analyzeTask(taskDescription);

  // Generate plan
  const plan = generatePlan(taskDescription, codebase, taskAnalysis);

  // Ensure directories exist
  if (!existsSync(AGENTS_DIR)) mkdirSync(AGENTS_DIR, { recursive: true });
  if (!existsSync(PLAN_DIR)) mkdirSync(PLAN_DIR, { recursive: true });

  // Write plan
  writeFileSync(join(PLAN_DIR, "orchestration.json"), JSON.stringify(plan, null, 2) + "\n");

  // Write human-readable plan
  const readme = `# 🍵 Orchestration Plan\n\n` +
    `**Task:** ${plan.task}\n\n` +
    `**Risk:** ${plan.analysis.riskLevel} | **Type:** ${plan.analysis.taskType} | **Scope:** ${plan.analysis.scope}\n\n` +
    `## Agent Chain\n\n` +
    plan.chain.map((p, i) => `${i + 1}. **${p.phase}** (${p.agent}) — ${p.description}`).join("\n") +
    `\n\n## Batches\n\n` +
    `Batch size: ${plan.analysis.batchSize} files\n` +
    `Estimated: ${plan.analysis.estimatedBatches} batches\n\n` +
    `## Risk Config\n\n` +
    `- Review: ${plan.riskConfig.review ? "Required" : "Optional"}\n` +
    `- Test: ${plan.riskConfig.test ? "Required" : "Optional"}\n` +
    `- Checkpoint: ${plan.riskConfig.checkpoint ? "Required" : "Optional"}\n` +
    `- Expert: ${plan.riskConfig.expertRequired ? "Required" : "Not required"}\n`;

  writeFileSync(join(PLAN_DIR, "orchestration.md"), readme);

  // Output
  console.log(formatPlan(plan));
  console.log(`\n📁 Plan saved to: ${join(PLAN_DIR, "orchestration.json")}`);

  return plan;
}

// ─── CLI Mode ────────────────────────────────────────────────────────────────

const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-orchestrate.js") ||
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-orchestrate")
);

if (isDirectInvocation) {
  const args = process.argv.slice(2).filter(a => !a.startsWith("--"));
  const task = args.join(" ");
  main(task);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export { scanCodebase, analyzeTask, generatePlan };
export default main;
