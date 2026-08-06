/**
 * 🍵 matcha — planning-gate.js
 * Planning gate validation. Blocks code modifications until Intent Discovery plan exists.
 * Plan file: .agents/plan/current.md (Session Memory) — legacy .agents/matcha-plan.md still accepted.
 * Accepts <matcha_gate> XML (legacy) OR markdown Intent Discovery (Problem/Goals/Success Criteria).
 *
 * Exports:
 *   checkPlanningGate(event) — returns { block, message } or null
 *   validatePlanContent(content) — returns { valid, message }
 *
 * Root resolution: getWorkspaceRoot() — walks up from cwd to the nearest
 * directory containing `.agents/`, so the gate works when launched from a
 * sub-project of a monorepo (plan lives at the workspace root).
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { isSimpleTask } from "./danger-checks.js";
import { getWorkspaceRoot } from "./workspace-root.js";

const ROOT = getWorkspaceRoot();
const STATE_FILE = join(ROOT, ".agents/matcha-state.json");

export function getIntensity() {
  try {
    if (existsSync(STATE_FILE)) {
      const state = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      return state.intensity || "enforce";
    }
  } catch {}
  return "enforce";
}

// ─── Plan location (Session Memory first, legacy fallback) ───────────────────
const PLAN_CANDIDATES = [
  join(ROOT, ".agents", "plan", "current.md"),
  join(ROOT, ".agents", "matcha-plan.md"),
];

export function findPlanPath() {
  for (const p of PLAN_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return null;
}

// ─── Plan validation — <matcha_gate> XML (legacy) OR markdown Intent Discovery ──
export function validatePlanContent(planContent) {
  if (!planContent || !planContent.trim()) {
    return { valid: false, message: "Plan file is empty." };
  }

  const gateMatch = planContent.match(/<matcha_gate>([\s\S]*?)<\/matcha_gate>/);
  if (gateMatch) {
    return validateGateFormat(gateMatch[1]);
  }

  const md = validateMarkdownPlan(planContent);
  if (md.valid) return { valid: true };

  return {
    valid: false,
    message: `The plan file does not contain a valid <matcha_gate> block or an Intent Discovery markdown plan.\nAccepted formats:\n1. <matcha_gate> XML — <what>/<why>/<how> each ≥15 chars, no placeholders.\n2. Markdown — **Problem:**, **Goals:**, **Success Criteria:** filled in (not TBD).\n\nFound: ${md.reason}`,
  };
}

function validateGateFormat(inner) {
  const grab = (tag) => {
    const m = inner.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m ? m[1].trim() : "";
  };
  const what = grab("what");
  const why = grab("why");
  const how = grab("how");

  const isTooShort = what.length < 15 || why.length < 15 || how.length < 15;
  const hasPlaceholders = isTooShort || [what, why, how].some(text =>
    text.includes("Describe what") ||
    text.includes("Why is this") ||
    text.includes("simplest and most") ||
    text === "..."
  );

  if (hasPlaceholders) {
    return { valid: false, message: "Your Intent Discovery plan is incomplete, too short (must be at least 15 characters per section), or contains placeholder text.\nPlease fill in the <what>, <why>, and <how> sections with actual project details." };
  }

  // Enhanced validation for larger tasks
  if (what.length + why.length + how.length < 200) return { valid: true };

  if (!(/\.[a-z]+(:\d+)?\b/i.test(what) || what.includes("/"))) {
    return { valid: false, message: `The <what> section must reference specific files (e.g. "Optimize sendMessage.js:120")\nFound: "${what.substring(0, 60)}..."` };
  }

  if (!(/\d+/.test(why) || /\b(profile|benchmark|metric|observe|measured|shows|redundant|slow|N\+1)\b/i.test(why))) {
    return { valid: false, message: `The <why> section must reference observed evidence (e.g. "Profiling shows 7 redundant queries")\nFound: "${why.substring(0, 60)}..."` };
  }

  const stepCount = (how.match(/(?:^|\n)\s*[-*]\s/g) || []).length;
  const numberedSteps = (how.match(/\d+\.\s/g) || []).length;
  if (stepCount + numberedSteps < 2) {
    return { valid: false, message: "The <how> section must list 2+ concrete implementation steps (as a list)." };
  }

  return { valid: true };
}

function validateMarkdownPlan(content) {
  const hasIntent = /Intent Discovery/i.test(content) || /\*\*Problem:\*\*/.test(content) || /^- Problem:/im.test(content);
  if (!hasIntent) {
    return { valid: false, reason: "no Intent Discovery marker (heading, **Problem:**, or - Problem:)" };
  }

  // Capture the section after each label until the next `- **` label, heading, or EOF
  // (handles multi-line values and bullet sub-lists without false-blocks)
  const section = (label) => {
    const m = content.match(new RegExp(`\\*\\*${label}:\\*\\*([\\s\\S]*?)(?=\\n\\s*-\\s*\\*\\*|\\n\\s*## |$)`, "i"));
    return m ? m[1].trim() : "";
  };

  const isTBD = (v) => {
    const cleaned = v.replace(/^[-*•]\s*/gm, "").trim();
    return !cleaned || cleaned.length < 5 || /\(?TBD\)?/i.test(cleaned) || cleaned === "..." || /Describe|Why is this|simplest and most/.test(cleaned);
  };

  const problem = section("Problem");
  const goals = section("Goals");
  const success = section("Success Criteria");

  if (isTBD(problem) || isTBD(goals) || isTBD(success)) {
    return {
      valid: false,
      reason: `TBD/missing fields (Problem: "${problem.slice(0, 40)}" | Goals: "${goals.slice(0, 40)}" | Success Criteria: "${success.slice(0, 40)}")`,
    };
  }
  return { valid: true };
}

export function checkPlanningGate(event) {
  if (!event) return null;

  const intensity = getIntensity();
  if (intensity === "observe") return null;

  // Smart auto-skip: detect simple tasks
  const toolName = event.tool || event.toolName || "";
  const input = event.input || {};
  if (isSimpleTask(toolName, input)) return null;

  const isWriteTool = [
    "WriteFile", "EditFile", "write_to_file", "replace_file_content",
    "multi_replace_file_content", "precise_diff_editor", "batch_file_writer",
    "edit_symbol", "edit_symbol_surgical", "patch", "edit", "write",
    "unifiedDiffCreate", "multiEdit"
  ].includes(toolName);

  const isCommandTool = [
    "Bash", "ExecuteCommand", "bash", "execute_command"
  ].includes(toolName);

  if (!isWriteTool && !isCommandTool) return null;

  // Skip if writing plan/session files (never block writing the plan itself)
  if (isWriteTool) {
    const targetFile = input.path || input.TargetFile || input.filePath || "";
    const files = input.files || [];
    const isPlanFile = (p) => /\bcurrent\.md$/.test(p) ||
                               (p || "").includes(".agents/plan/") ||
                               (p || "").includes(".agents/reports/") ||
                               (p || "").endsWith("matcha-plan.md") ||
                               (p || "").endsWith("matcha-state.json") ||
                               (p || "").endsWith("decisions.log");
    if (isPlanFile(targetFile) || files.some(f => isPlanFile(f.path))) return null;
  }

  // Skip safe commands
  if (isCommandTool) {
    const cmd = (input.command || input.code || "").trim();
    const isSafe = /^(git status|git diff|npm test|vitest|find |ls |cat |grep |agy status)/i.test(cmd);
    if (isSafe) return null;
  }

  // Check if plan exists (Session Memory path first, legacy fallback)
  const planPath = findPlanPath();
  if (!planPath) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nYou are trying to execute a codebase modification or command before planning.\nUnder the matcha philosophy (enforce mode), you MUST create a plan first.\n\nAction required:\nWrite your Intent Discovery plan to .agents/plan/current.md BEFORE the first code edit — do not wait for a user command.\n\nAccepted format (markdown):\n---\ntitle: <task>\ndate: <date>\ntype: plan\nstatus: active\n---\n# 🍵 Intent Discovery\n- **Problem:** ...\n- **Goals:** ...\n- **Success Criteria:** ...\n\n(legacy <matcha_gate> XML at .agents/matcha-plan.md still accepted)\n`
    };
  }

  // Validate plan content
  let planContent = "";
  try {
    planContent = readFileSync(planPath, "utf-8");
  } catch {
    return null;
  }

  const validation = validatePlanContent(planContent);
  if (!validation.valid) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\n${validation.message}`
    };
  }

  return null;
}
