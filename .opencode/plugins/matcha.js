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
 */

import { checkPlanningGate } from "../../hooks/planning-gate.js";

const DANGER_PATTERNS = [
  /^rm\s+-rf?\s+\/\s*$/,
  /^rm\s+-rf?\s+~\s*$/,
  /^rm\s+-rf?\s+\.\s*$/,
  /^chmod\s+777(\s|$)/,
  /^git\s+push\s+--force(\s|$)/,
  /\bdrop\s+database\b/i,
  /\btruncate\s+table\b/i,
  /^(curl|wget)\s+.*\|(bash|sh)\s*$/,
];

function isDangerous(command) {
  return DANGER_PATTERNS.some((p) => p.test(command));
}

export const MatchaPlugin = async () => {
  return {
    // Shield + planning gate before every tool execution
    "tool.execute.before": async (input, output) => {
      const tool = (input.tool || "").toLowerCase();
      const args = output.args || {};

      // Shield: block destructive bash commands
      if (tool === "bash" && args.command) {
        const cmd = String(args.command).trim();
        if (isDangerous(cmd)) {
          throw new Error(
            `🍵 matcha: shield blocked\n\nCommand: ${cmd}\nThis command is destructive. Use a specific path or --force-with-lease.`
          );
        }
      }

      // Planning gate: block code edits/commands until an Intent Discovery plan exists.
      // Maps opencode events to the shared hook — reuse, not duplicate.
      const gate = checkPlanningGate({ tool, input: args });
      if (gate) {
        throw new Error(gate.message);
      }
    },
  };
};
