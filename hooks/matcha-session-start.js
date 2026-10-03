/**
 * 🍵 matcha — matcha-session-start.js
 * SessionStart hook: self-enforcing plan resume (issue #3 P2).
 * Session-memory continuity must not depend on model recall — inject the
 * one-line plan hint as additionalContext at session start.
 *
 * Claude Code SessionStart contract: exit 0 + JSON on stdout with
 * hookSpecificOutput.additionalContext.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "./workspace-root.js";
import { getIntensity } from "./planning-gate.js";
import { getPlanResumeHint } from "./plan-compact.js";

export function getSessionStartContext(cwd) {
  const root = getWorkspaceRoot(cwd);
  if (getIntensity(root) === "off") return "";
  try {
    const planPath = join(root, ".agents", "plan", "current.md");
    if (!existsSync(planPath)) return "";
    const hint = getPlanResumeHint(readFileSync(planPath, "utf-8"));
    if (!hint) return "";
    return `🍵 matcha resume: ${hint} — read .agents/plan/current.md at task start; intent mismatch → overwrite, never follow a stale plan.`;
  } catch {
    return "";
  }
}

// ─── CLI Mode — Claude Code SessionStart hook ────────────────────────────────
const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-session-start.js") ||
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-session-start")
);

if (isDirectInvocation) {
  const ctx = getSessionStartContext();
  if (!ctx) process.exit(0);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { additionalContext: ctx },
  }) + "\n");
  process.exit(0);
}
