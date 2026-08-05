#!/usr/bin/env node
/**
 * 🍵 matcha — AGY (Antigravity CLI) hooks adapter
 *
 * AGY hooks (hooks.json) send tool events as JSON on stdin with a DIFFERENT
 * shape than Claude Code (toolCall.name / toolCall.args.CommandLine). This
 * adapter maps those to matcha's internal tool names and reuses the SAME
 * engine as every other platform (danger-checks + planning-gate — Never Twice).
 *
 * AGY PreToolUse contract:
 *   in:  { "toolCall": { "name": "run_command", "args": { "CommandLine": "..." } }, ... }
 *   out: { "decision": "allow" | "deny", "reason": "..." }
 *
 * Fail-open: any parse/runtime error returns allow — never lock the agent.
 */
import { checkCommand } from "./danger-checks.js";
import { checkPlanningGate } from "./planning-gate.js";

// AGY tool names → matcha internal tool names (already understood by the engine)
const TOOL_MAP = {
  run_command: "execute_command",
  write_file: "write_to_file",
  write_to_file: "write_to_file",
  create_file: "write_to_file",
  edit_file: "edit",
  apply_patch: "edit",
  replace_file_content: "replace_file_content",
  read_file: "read",
  list_files: "list",
  glob_code: "glob",
  grep_code: "grep",
};

function mapEvent(event) {
  const toolCall = event.toolCall || {};
  const name = String(toolCall.name || "").toLowerCase();
  const args = toolCall.args || {};
  const tool = TOOL_MAP[name] || name || "unknown";
  const command = args.CommandLine || args.command || args.code || "";
  const filePath = args.FilePath || args.filePath || args.path || "";
  return { tool, input: { command, path: filePath, filePath } };
}

function respond(decision, reason) {
  process.stdout.write(JSON.stringify({ decision, reason: reason || "" }) + "\n");
}

let raw = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(raw || "{}");
    const { tool, input } = mapEvent(event);

    // Planning gate — blocks code writes/commands until a valid plan exists
    const gate = checkPlanningGate({ tool, input });
    if (gate) return respond("deny", gate.message);

    // Safety shield — destructive commands
    if (tool === "execute_command" && input.command) {
      const danger = checkCommand(input.command);
      if (danger) return respond("deny", danger.message);
    }

    respond("allow", "");
  } catch (err) {
    // Fail-open: adapter bugs must never brick the agent
    process.stderr.write("🍵 matcha agy-hooks: " + (err && err.message ? err.message : err) + "\n");
    respond("allow", "");
  }
});
