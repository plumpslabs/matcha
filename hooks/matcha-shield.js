/**
 * 🍵 matcha — matcha-shield.js
 * Deterministic safety gate. Blocks dangerous commands before they reach the OS.
 *
 * Thin orchestrator — logic lives in:
 *   - danger-checks.js  — dangerous command detection + simple task auto-skip
 *   - planning-gate.js  — Intent Discovery plan validation
 *   - mode-detect.js    — context-aware mode detection
 *
 * Dual-mode:
 *   1. CLI mode (Claude Code PreToolUse hook):
 *      Reads event JSON from stdin, exits with code 2 to block.
 *   2. Programmatic mode (ESM export):
 *      Returns { block, message } for dangerous commands.
 *
 * Override: MATCHA_SHIELD_OFF=true
 */

import { readFileSync } from "fs";
import { join } from "path";
import { checkCommand, DANGER_PATTERNS } from "./danger-checks.js";
import { checkPlanningGate } from "./planning-gate.js";
import { detectMode, writeMode, getPreviousMode } from "./mode-detect.js";
import { recordShieldBlock, recordPlanningGateBlock, recordModeSwitch } from "./matcha-metrics.js";

// Re-export for backward compatibility with tests
export { DANGER_PATTERNS, checkPlanningGate };

const ROOT = process.cwd();

function parseEvent(event) {
  if (!event) return null;
  const toolName = event.tool || event.toolName || "";
  if (!["Bash", "ExecuteCommand", "bash", "execute_command"].includes(toolName))
    return null;
  return (event.input?.command || event.input?.code || "").trim() || null;
}

export async function beforeToolUse(event, context) {
  if (process.env.MATCHA_SHIELD_OFF === "true") return null;

  // Auto-detect mode
  const toolName = event?.tool || event?.toolName || "";
  const input = event?.input || {};
  if (toolName) {
    const mode = detectMode(toolName, input);
    const prevState = getPreviousMode();
    writeMode(mode);
    if (prevState.mode && prevState.mode !== mode) recordModeSwitch(mode, prevState.mode);
  }

  // Planning gate
  const gateResult = checkPlanningGate(event);
  if (gateResult) {
    recordPlanningGateBlock();
    return { block: true, message: gateResult.message, metadata: { gate: true, convention: "matcha" } };
  }

  // Danger check
  const command = parseEvent(event);
  if (!command) return null;

  const result = checkCommand(command);
  if (result) {
    recordShieldBlock(command, result.message);
    return {
      block: true,
      message: result.message,
      metadata: { shield: true, convention: "matcha", blocked_pattern: result.blockedPattern },
    };
  }

  return null;
}

export default async function handler(event, context) {
  return beforeToolUse(event, context);
}

// ─── CLI Mode ─────────────────────────────────────────────────────────────
const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-shield.js") ||
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-shield")
);

if (isDirectInvocation) {
  let input = "";
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    if (process.env.MATCHA_SHIELD_OFF === "true") {
      process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
      process.exit(0);
    }

    try {
      const event = JSON.parse(input);

      const gateResult = checkPlanningGate(event);
      if (gateResult) {
        process.stdout.write(JSON.stringify({ decision: "deny", message: gateResult.message, metadata: { gate: true, convention: "matcha" } }) + "\n");
        process.stderr.write(gateResult.message + "\n");
        process.exit(2);
      }

      const command = parseEvent(event);
      if (!command) {
        process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
        process.exit(0);
      }

      const result = checkCommand(command);
      if (result) {
        process.stdout.write(JSON.stringify({ decision: "deny", message: result.message, metadata: { shield: true, convention: "matcha" } }) + "\n");
        process.stderr.write(result.message + "\n");
        process.exit(2);
      }

      process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
      process.exit(0);
    } catch (e) {
      process.stderr.write(`matcha-shield: parse error — ${e.message}\n`);
      process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
      process.exit(0);
    }
  });
}
