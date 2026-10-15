/**
 * 🍵 matcha — matcha-core.js (shared orchestration core)
 * Pulls together: intensity detection → planning gate → shield check → metrics.
 * Both matcha-shield.js and matcha-agy-hooks.js import from here to avoid drift.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { checkCommand, DANGER_PATTERNS } from "./danger-checks.js";
import { checkPlanningGate, getIntensity } from "./planning-gate.js";
import { recordShieldBlock, recordPlanningGateBlock, recordModeSwitch } from "./matcha-metrics.js";
import { detectMode } from "./mode-detect.js";
import { recordAuditLog } from "./audit-log.js";

// Shared: determine whether to proceed based on intensity + plan + gate + shield
export function shouldBlock(toolName, input, cwd, event) {
  const intensity = getIntensity(cwd);
  if (intensity === "off" || intensity === "observe") return { block: false, reason: null };

  // Planning gate — blocks code writes/commands until a valid plan exists
  const gate = checkPlanningGate({ tool: toolName, input, cwd });
  if (gate) {
    recordPlanningGateBlock();
    return { block: true, reason: gate.message };
  }

  // Safety shield — destructive commands
  if (toolName === "execute_command" && input.command) {
    const danger = checkCommand(input.command);
    if (danger) {
      recordShieldBlock(input.command, danger.message);
      return { block: true, reason: danger.message };
    }
  }

  return { block: false, reason: null };
}

/**
 * Map AGY toolCall name to matcha internal tool name.
 * Also pass workspacePaths from AGY so planning-gate finds the real plan.
 */
export function mapEvent(event) {
  const toolCall = event.toolCall || {};
  const name = String(toolCall.name || "").toLowerCase();
  const args = toolCall.args || {};
  const tool = {
    execute_command: "execute_command",
    bash: "execute_command",
    edit: "edit",
    edit_file: "edit",
    replace: "edit",
    apply_patch: "edit",
    write_file: "write_to_file",
    write_to_file: "write_to_file",
    create_file: "write_to_file",
    create: "write_to_file",
    replace_file_content: "replace_file_content",
    read: "read",
    read_file: "read",
    view_file: "read",
    list: "list",
    list_files: "list",
    list_directory: "list",
    glob: "glob",
    glob_code: "glob",
    grep: "grep",
    grep_search: "grep",
    grep_code: "grep",
  }[name] || name || "unknown";

  const filePath = args.FilePath || args.filePath || args.TargetFile || args.path || "";
  const cwd = (Array.isArray(event.workspacePaths) && event.workspacePaths[0]) || "";

  return { tool, input: { command: args.CommandLine || args.command || args.code || "", path: filePath, filePath }, cwd };
}