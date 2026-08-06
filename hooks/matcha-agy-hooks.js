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

// AGY tool names → matcha internal tool names (already understood by the engine).
// Names are lowercased before lookup (mapEvent does name.toLowerCase()), so
// PascalCase display names (Edit, Bash) and snake_case internal names (view_file,
// replace, grep_search) both land here.
const TOOL_MAP = {
  // command execution
  run_command: "execute_command",
  bash: "execute_command",
  // write/edit tools (agy: Edit, replace, write_file)
  edit: "edit",
  edit_file: "edit",
  replace: "edit",
  apply_patch: "edit",
  write_file: "write_to_file",
  write_to_file: "write_to_file",
  create_file: "write_to_file",
  replace_file_content: "replace_file_content",
  // read tools (agy: view_file = Read)
  read: "read",
  read_file: "read",
  view_file: "read",
  // search/list tools
  list: "list",
  list_files: "list",
  list_directory: "list",
  glob: "glob",
  glob_code: "glob",
  grep: "grep",
  grep_search: "grep",
  grep_code: "grep",
};

function mapEvent(event) {
  const toolCall = event.toolCall || {};
  const name = String(toolCall.name || "").toLowerCase();
  const args = toolCall.args || {};
  const tool = TOOL_MAP[name] || name || "unknown";
  const command = args.CommandLine || args.command || args.code || "";
  // AGY's edit tools (Edit, replace) pass the target via `TargetFile`, not
  // FilePath — without this, plan-file writes via Edit would still deadlock.
  const filePath = args.FilePath || args.filePath || args.TargetFile || args.path || "";
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
