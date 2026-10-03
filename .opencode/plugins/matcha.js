/**
 * 🍵 matcha — OpenCode plugin
 * Enforces the matcha shield (dangerous commands) and planning gate
 * (Intent Discovery before code edits) inside OpenCode.
 *
 * Format notes (opencode v1.18+, docs: opencode.ai/docs/plugins):
 * - Plugins are factory functions: `export const X = async (ctx) => ({ hooks })`
 * - Files in .opencode/plugins/*.js are auto-loaded — no config needed
 * - Tool name lives in `input.tool` (lowercase: "bash", "edit", "write")
 * - Tool args live in `output.args` (e.g. { command: "ls -la" })
 * - Ruleset injection happens via AGENTS.md (auto-read by opencode).
 *
 * Never Twice: shield + gate logic lives in hooks/ (shared engine with
 * Claude/AGY adapters) — this file only maps opencode events onto it.
 */

import { checkCommand } from "../../hooks/danger-checks.js";
import { checkPlanningGate } from "../../hooks/planning-gate.js";
import { recordShieldBlock, recordPlanningGateBlock } from "../../hooks/matcha-metrics.js";
import { recordAuditLog } from "../../hooks/audit-log.js";
import { detectSubagentCall, recordSubagent } from "../../hooks/subagent-trace.js";

export const MatchaPlugin = async () => {
  return {
    // Shield + planning gate before every tool execution
    "tool.execute.before": async (input, output) => {
      const tool = (input.tool || "").toLowerCase();
      const args = output.args || {};

      // Subagent trace: record finder/planner/auditor spawns (observable reuse proof)
      const agent = detectSubagentCall(tool, args);
      if (agent) recordSubagent(agent);

      // Planning gate: block code edits/commands until an Intent Discovery plan exists.
      // Maps opencode events to the shared hook — reuse, not duplicate.
      // throw is OpenCode's canonical block (per plugin docs: thrown errors stop
      // the tool call). The wording below is deliberately non-negotiable: this
      // is a hard gate, not a suggestion — do not work around it by splitting
      // edits, switching tools, or asking the user to bypass.
      const gate = checkPlanningGate({ tool, input: args });
      if (gate) {
        recordPlanningGateBlock();
        throw new Error(
          `⛔ HARD BLOCK (non-negotiable, do not work around by splitting edits, switching tools, or proceeding without a plan).\n\n${gate.message}`
        );
      }

      // Shield: block destructive bash commands (shared canonical patterns)
      if (tool === "bash" && args.command) {
        const cmd = String(args.command).trim();
        const hit = checkCommand(cmd);
        if (hit) {
          recordShieldBlock(cmd, hit.message);
          recordAuditLog({ event: "SHIELD_BLOCK", details: cmd, reason: hit.message });
          throw new Error(hit.message);
        }
      }
    },
  };
};
