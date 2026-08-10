/**
 * 🍵 matcha — planning-gate.js
 * Planning gate validation. Blocks code modifications until Intent Discovery plan exists.
 * Plan file: .agents/plan/current.md (Session Memory) — legacy .agents/matcha-plan.md still accepted for backward compatibility.
 * Accepts markdown Intent Discovery (Problem/Goals/Success Criteria) OR <matcha_gate> XML (legacy).
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

// ─── Plan-file detection — shared by write-tool AND command-tool branches ─────
// Never Twice: one source of truth for what counts as a matcha session file.
// Used to (a) exempt write tools targeting plan files and (b) exempt bash/python
// commands that write the plan file (anti-deadlock: the gate must never block
// the agent from creating the very plan it demands).
export function isPlanFilePath(value) {
  const s = String(value || "");
  return (
    /\.agents[\\/]plan[\\/]/.test(s) ||
    /\.agents[\\/]reports[\\/]/.test(s) ||
    s.includes("matcha-plan.md") ||
    s.includes("matcha-state.json") ||
    s.includes("mcp_config.json") ||
    s.includes("decisions.log") ||
    /current\.md$/.test(s)
  );
}

// ─── Plan validation — markdown Intent Discovery OR <matcha_gate> XML (legacy) ──
export function validatePlanContent(planContent) {
  if (!planContent || !planContent.trim()) {
    return { valid: false, message: "Plan file is empty." };
  }

  // ⚖️ Proportionality: a plan marked trivial (≤5 LOC, 1 file, no logic change) only
  // needs a problem statement — not the full <what>/<why>/<how> gate. This keeps the
  // mechanical hook from blocking typo-fix-level tasks (the exact paralysis the
  // Proportionality principle exists to prevent). Markers: `<!-- trivial -->` or
  // `type: plan-trivial` in frontmatter.
  const isTrivial =
    /<!--\s*trivial\s*-->/.test(planContent) || /type:\s*plan-trivial/i.test(planContent);
  if (isTrivial) {
    const hasProblem =
      /\*\*Problem:\*\*/i.test(planContent) || /^- Problem:/im.test(planContent) || /<problem>/i.test(planContent) || /^#+\s*Problem/im.test(planContent);
    const tooShort = planContent.trim().length < 15;
    if (hasProblem && !tooShort) {
      return { valid: true };
    }
    return {
      valid: false,
      message: "Trivial plan must include a **Problem:** statement (e.g. **Problem:** Rename `foo` to `bar` in src/x.js).",
    };
  }

  const gateMatch = planContent.match(/<matcha_gate>([\s\S]*?)<\/matcha_gate>/);
  if (gateMatch) {
    return validateGateFormat(gateMatch[1]);
  }

  const md = validateMarkdownPlan(planContent);
  if (md.valid) return { valid: true };

  return {
    valid: false,
    message: `The plan file does not contain a valid <matcha_gate> block or an Intent Discovery markdown plan.\nRequired format in .agents/plan/current.md:\n---\ntitle: <task>\ndate: <date>\ntype: plan\nstatus: active\n---\n# 🍵 Intent Discovery\n- **Problem:** ...\n- **Goals:** ...\n- **Success Criteria:** ...\n\nFound: ${md.reason}`,
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
  const hasIntent = /Intent Discovery/i.test(content) || /Problem/i.test(content);
  if (!hasIntent) {
    return { valid: false, reason: "no Intent Discovery marker (heading, **Problem:**, or - Problem:)" };
  }

  // Robust & Forgiving section extractor
  const section = (label) => {
    const pattern = new RegExp(
      `(?:^|\\n)(?:\\s*[-*•]\\s*)?(?:#+\\s*|\\*\\*|__)?${label}(?:\\*\\*|__)?\\s*:\\s*([\\s\\S]*?)(?=\\n(?:\\s*[-*•]\\s*)?(?:#+\\s*|\\*\\*|__)?(?:Problem|Goals|Success Criteria|Plan|Risks|Reuse Ledger)(?:\\*\\*|__)?\\s*:|\\n\\s*## |$)`,
      "i"
    );
    const m = content.match(pattern);
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
    if (isPlanFilePath(targetFile) || files.some(f => isPlanFilePath(f.path))) return null;
  }

  // Skip safe commands — INCLUDING any command that writes the plan file itself.
  if (isCommandTool) {
    const cmd = (input.command || input.code || "").trim();
    const isSafe = /^(git status|git diff|npm test|vitest|find |ls |cat |grep |agy status)/i.test(cmd);
    if (isSafe || isPlanFilePath(cmd)) return null;
  }

  // Check if plan exists (Session Memory path first, legacy fallback)
  const planPath = findPlanPath();
  if (!planPath) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nYou are trying to execute a codebase modification or command before planning.\nUnder the matcha philosophy (enforce mode), you MUST create a plan first.\n\nAction required:\nWrite your Intent Discovery plan to .agents/plan/current.md BEFORE the first code edit — do not wait for a user command.\n\n✅ Writing to .agents/plan/current.md is ALWAYS allowed — create the plan there now via Edit/WriteFile (that write is never blocked).\n\nAccepted format (markdown):\n---\ntitle: <task>\ndate: <date>\ntype: plan\nstatus: active\n---\n# 🍵 Intent Discovery\n- **Problem:** ...\n- **Goals:** ...\n- **Success Criteria:** ...\n\n⚖️ Trivial edit (≤5 LOC, 1 file, no logic)? Use the minimal plan instead — carry the marker:\n---\ntitle: <task>\ndate: <date>\ntype: plan-trivial\nstatus: active\n---\n<!-- trivial -->\n**Problem:** Rename \`foo\` → \`bar\` in src/x.js\n`
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
      message: `🍵 matcha: Planning Gate Blocked\n\n${validation.message}\n\n✅ Editing .agents/plan/current.md is ALWAYS allowed — fix the plan there via Edit/WriteFile (that write is never blocked).`
    };
  }

  return null;
}
