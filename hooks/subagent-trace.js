/**
 * 🍵 matcha — subagent-trace.js
 * Finder/auditor trace enforcement (prompt-only → observable).
 *
 * Problem: `@matcha-finder` / `@matcha-auditor` spawning is prompt-level —
 * the model may skip it. Hooks cannot force a spawn, but they CAN observe
 * Task-tool invocations and record them, so the stop hook can warn when
 * source files were edited with no reuse-search trace.
 *
 * Trace file: .agents/state/subagents.json — [{ agent, at }]
 * Validity window: entries newer than the live plan file mtime (task start).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "./workspace-root.js";

const TRACE_AGENTS = ["matcha-finder", "matcha-planner", "matcha-auditor", "matcha-reviewer"];

function tracePath(cwd) {
  return join(getWorkspaceRoot(cwd), ".agents", "state", "subagents.json");
}

function readTrace(cwd) {
  try {
    const p = tracePath(cwd);
    if (!existsSync(p)) return [];
    const arr = JSON.parse(readFileSync(p, "utf-8"));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Detect a subagent invocation from a tool event. Provider-agnostic:
 * matches Task-like tool names and scans serialized input for agent names.
 * @returns {string|null} agent name or null
 */
export function detectSubagentCall(toolName, input) {
  const t = String(toolName || "").toLowerCase();
  const isTaskLike = /^(task|delegate|spawn_subagent|subagent|agent)$/.test(t);
  if (!isTaskLike) return null;
  let blob = "";
  try {
    blob = JSON.stringify(input || {});
  } catch {
    return null;
  }
  for (const a of TRACE_AGENTS) {
    if (blob.toLowerCase().includes(a)) return a;
  }
  return null;
}

/** Record a subagent invocation (fail-safe, never throws). */
export function recordSubagent(agent, cwd) {
  try {
    const p = tracePath(cwd);
    const dir = join(getWorkspaceRoot(cwd), ".agents", "state");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const trace = readTrace(cwd);
    trace.push({ agent, at: new Date().toISOString() });
    writeFileSync(p, JSON.stringify(trace.slice(-50), null, 2) + "\n", "utf-8");
    return true;
  } catch {
    return false;
  }
}

/**
 * Check whether a reuse-search trace exists for the current task.
 * Valid = finder/planner entry newer than the live plan file mtime.
 * @returns {{traced: boolean, reason: string}}
 */
export function checkReuseTrace(cwd) {
  const trace = readTrace(cwd);
  if (trace.length === 0) return { traced: false, reason: "no subagent trace recorded" };
  let planMtime = 0;
  try {
    const root = getWorkspaceRoot(cwd);
    for (const p of [join(root, ".agents", "plan", "current.md"), join(root, ".agents", "matcha-plan.md")]) {
      if (existsSync(p)) planMtime = Math.max(planMtime, statSync(p).mtimeMs);
    }
  } catch {}
  const fresh = trace.filter((e) => {
    if (e.agent !== "matcha-finder" && e.agent !== "matcha-planner") return false;
    const at = Date.parse(e.at || "");
    if (Number.isNaN(at)) return false;
    // No plan mtime (fresh checkout) → any trace counts; else must postdate plan.
    // 2s tolerance covers fs mtime granularity vs ISO-ms timestamps (same-ms race).
    return planMtime === 0 || at >= planMtime - 2000;
  });
  if (fresh.length === 0) return { traced: false, reason: "finder/planner trace predates current plan" };
  return { traced: true, reason: `found ${fresh[fresh.length - 1].agent} trace` };
}
