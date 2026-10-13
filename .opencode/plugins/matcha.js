/**
 * 🍵 matcha — OpenCode plugin (dual-host: v1 + v2)
 * Enforces the matcha shield (dangerous commands) and planning gate
 * (Intent Discovery before code edits) inside OpenCode.
 *
 * Loader contract (verified against v2 loader schema + v1.18 module form):
 * - v2 requires a DEFAULT export object `{ id, setup|effect }` — a named
 *   factory export alone fails with "must export a default definition".
 * - v1 (>=1.18) accepts a default object with `server()` and ignores `setup`.
 * - The shared gate logic below is host-agnostic; only the event mapping
 *   differs (v1: (input, output), v2: mutable event draft via ctx.tool.hook).
 *
 * Never Twice: shield + gate logic lives in hooks/ (shared engine with
 * Claude/AGY adapters) — this file only maps host events onto it.
 */

import { checkCommand } from "../../hooks/danger-checks.js";
import { checkPlanningGate } from "../../hooks/planning-gate.js";
import { recordShieldBlock, recordPlanningGateBlock } from "../../hooks/matcha-metrics.js";
import { recordAuditLog } from "../../hooks/audit-log.js";
import { detectSubagentCall, recordSubagent } from "../../hooks/subagent-trace.js";

// ─── Shared enforcement (host-agnostic) ─────────────────────────────────────
// tool: lowercase tool name ("bash", "edit", "write").
// args: tool arguments object ({ command, ... }).
// Throws on block (both hosts treat a thrown error as a denied tool call).
function enforceGate(tool, args) {
  const name = (tool || "").toLowerCase();
  const argv = args || {};

  // Subagent trace: record finder/planner/auditor spawns (observable reuse proof)
  const agent = detectSubagentCall(name, argv);
  if (agent) recordSubagent(agent);

  // Planning gate: block code edits/commands until an Intent Discovery plan exists.
  // Maps opencode events to the shared hook — reuse, not duplicate.
  // Throw is OpenCode's canonical block per plugin docs: thrown errors stop
  // the tool call. The wording below is deliberately non-negotiable: this
  // is a hard gate, not a suggestion — do not work around it by splitting
  // edits, switching tools, or asking the user to bypass.
  const gate = checkPlanningGate({ tool: name, input: argv });
  if (gate) {
    recordPlanningGateBlock();
    throw new Error(
      `⛔ HARD BLOCK (non-negotiable, do not work around by splitting edits, switching tools, or proceeding without a plan).\n\n${gate.message}`
    );
  }

  // Shield: block destructive bash commands (shared canonical patterns)
  if (name === "bash" && argv.command) {
    const cmd = String(argv.command).trim();
    const hit = checkCommand(cmd);
    if (hit) {
      recordShieldBlock(cmd, hit.message);
      recordAuditLog({ event: "SHIELD_BLOCK", details: cmd, reason: hit.message });
      throw new Error(hit.message);
    }
  }
}

// ─── v1 host: factory (named export, legacy mode requires functions) ────────
export const MatchaPlugin = async () => {
  return {
    // Shield + planning gate before every tool execution
    "tool.execute.before": async (input, output) => {
      enforceGate(input.tool, output.args);
    },
  };
};

// ─── v1 host: module object form (v1 >= 1.18 calls server(), ignores setup) ─
async function server() {
  return {
    "tool.execute.before": async (input, output) => {
      enforceGate(input.tool, output.args);
    },
  };
}

// ─── v2 host: setup registers hooks on ctx (mutable event draft) ────────────
// Guarded: if a host exposes no tool.hook domain, setup resolves silently so
// the plugin still loads (load-green) instead of failing the whole file.
async function setup(ctx) {
  const hook = ctx && ctx.tool && typeof ctx.tool.hook === "function"
    ? ctx.tool.hook.bind(ctx.tool)
    : null;
  if (!hook) return;
  await hook("execute.before", async (event) => {
    const e = event || {};
    // v2 draft shape: tool name + args live on the event; be liberal —
    // field names vary across v2 builds, so probe every known location.
    const tool = e.tool ?? e.toolName ?? e.name ?? e.input?.tool ?? "";
    const args = e.input ?? e.args ?? e.output?.args ?? {};
    enforceGate(tool, args);
  });
}

export default {
  id: "matcha",
  server,
  setup,
};
