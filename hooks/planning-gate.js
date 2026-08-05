/**
 * 🍵 matcha — planning-gate.js
 * Planning gate validation. Blocks code modifications until Intent Discovery plan exists.
 *
 * Exports:
 *   checkPlanningGate(event) — returns { block, message } or null
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { isSimpleTask } from "./danger-checks.js";

const ROOT = process.cwd();
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
    "edit_symbol", "edit_symbol_surgical", "patch"
  ].includes(toolName);

  const isCommandTool = [
    "Bash", "ExecuteCommand", "bash", "execute_command"
  ].includes(toolName);

  if (!isWriteTool && !isCommandTool) return null;

  // Skip if writing plan files
  if (isWriteTool) {
    const targetFile = input.path || input.TargetFile || input.filePath || "";
    const files = input.files || [];
    const isWritingPlan = targetFile.endsWith("matcha-plan.md") ||
                          targetFile.endsWith("matcha-state.json") ||
                          files.some(f => f.path?.endsWith("matcha-plan.md") || f.path?.endsWith("matcha-state.json"));
    if (isWritingPlan) return null;
  }

  // Skip safe commands
  if (isCommandTool) {
    const cmd = (input.command || input.code || "").trim();
    const isSafe = /^(git status|git diff|npm test|vitest|find |ls |cat |grep |agy status)/i.test(cmd);
    if (isSafe) return null;
  }

  // Check if plan exists
  const planPath = join(ROOT, ".agents/matcha-plan.md");
  if (!existsSync(planPath)) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nYou are trying to execute a codebase modification or command before planning.\nUnder the matcha philosophy (enforce mode), you MUST create a plan first.\n\nAction required:\nCreate and write your Intent Discovery plan to .agents/matcha-plan.md using the following format:\n\n<matcha_gate>\n  <what>Describe what you are building/fixing</what>\n  <why>Why is this necessary? What is the impact?</why>\n  <how>What is the simplest and most efficient implementation path?</how>\n</matcha_gate>\n`
    };
  }

  // Validate plan content
  let planContent = "";
  try {
    planContent = readFileSync(planPath, "utf-8");
  } catch {
    return null;
  }

  const matchaGateRegex = /<matcha_gate>([\s\S]*?)<\/matcha_gate>/;
  const match = planContent.match(matchaGateRegex);

  if (!match) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nThe file .agents/matcha-plan.md exists, but it does not contain a valid <matcha_gate> block.\nPlease enclose your plan in:\n\n<matcha_gate>\n  <what>...</what>\n  <why>...</why>\n  <how>...</how>\n</matcha_gate>\n`
    };
  }

  const innerContent = match[1];
  const whatMatch = innerContent.match(/<what>([\s\S]*?)<\/what>/);
  const whyMatch = innerContent.match(/<why>([\s\S]*?)<\/why>/);
  const howMatch = innerContent.match(/<how>([\s\S]*?)<\/how>/);

  const whatText = (whatMatch ? whatMatch[1] : "").trim();
  const whyText = (whyMatch ? whyMatch[1] : "").trim();
  const howText = (howMatch ? howMatch[1] : "").trim();

  // Check for placeholders or too-short sections
  const isTooShort = whatText.length < 15 || whyText.length < 15 || howText.length < 15;
  const hasPlaceholders = isTooShort || [whatText, whyText, howText].some(text =>
    text.includes("Describe what") ||
    text.includes("Why is this") ||
    text.includes("simplest and most") ||
    text === "..."
  );

  if (hasPlaceholders) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nYour Intent Discovery plan in .agents/matcha-plan.md is incomplete, too short (must be at least 15 characters per section), or contains placeholder text.\nPlease fill in the <what>, <why>, and <how> sections with actual project details.\n`
    };
  }

  // Enhanced validation for larger tasks
  const totalPlanChars = whatText.length + whyText.length + howText.length;
  if (totalPlanChars < 200) return null; // Simple task, skip enhanced validation

  // <what> must reference specific files
  const hasFileRef = /\.[a-z]+(:\d+)?\b/i.test(whatText) || whatText.includes("/");
  if (!hasFileRef) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nThe <what> section must reference specific files (e.g. "Optimize sendMessage.js:120")\nFound: "${whatText.substring(0, 60)}..."\n`
    };
  }

  // <why> must reference observed evidence
  const hasEvidence = /\d+/.test(whyText) ||
    /\b(profile|benchmark|metric|observe|measured|shows|redundant|slow|N\+1)\b/i.test(whyText);
  if (!hasEvidence) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nThe <why> section must reference observed evidence (e.g. "Profiling shows 7 redundant queries")\nFound: "${whyText.substring(0, 60)}..."\n`
    };
  }

  // <how> must list 2+ concrete steps
  const stepCount = (howText.match(/(?:^|\n)\s*[-*]\s/g) || []).length;
  const numberedSteps = (howText.match(/\d+\.\s/g) || []).length;
  if (stepCount + numberedSteps < 2) {
    return {
      block: true,
      message: `🍵 matcha: Planning Gate Blocked\n\nThe <how> section must list 2+ concrete implementation steps (as a list).\n`
    };
  }

  return null;
}
