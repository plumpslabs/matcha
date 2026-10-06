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
import { suggestIntensity } from "./blast-radius.js";

export function getSessionStartContext(cwd) {
  const root = getWorkspaceRoot(cwd);
  if (getIntensity(root) === "off") return "";
  const parts = [];
  try {
    const planPath = join(root, ".agents", "plan", "current.md");
    if (existsSync(planPath)) {
      const hint = getPlanResumeHint(readFileSync(planPath, "utf-8"));
      if (hint) parts.push(`🍵 matcha resume: ${hint} — read .agents/plan/current.md at task start; intent mismatch → overwrite, never follow a stale plan.`);
    }
  } catch {}
  // Adaptive auto-routing (issue #6): declare intensity + reason at task start.
  try {
    const auto = suggestIntensity(undefined, root);
    if (auto.tier !== "L0" || parts.length > 0) parts.push(`🍵 matcha ${auto.reason} (override: /matcha:intensity).`);
  } catch {}
  return parts.join("\n");
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
