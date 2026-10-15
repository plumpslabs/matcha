/**
 * 🍵 matcha — matcha-shield.js
 * Deterministic safety gate. Blocks dangerous commands before they reach the OS.
 * Thin orchestrator — core logic in hooks/matcha-core.js.
 *
 * Dual-mode:
 *   1. CLI mode (Claude Code PreToolUse hook):
 *      Reads event JSON from stdin, exits with code 2 to block.
 *   2. Programmatic mode (ESM export):
 *      Returns { block, message } for dangerous commands.
 *
 * Override: MATCHA_SHIELD_OFF=true
 */

import { recordAuditLog } from "./audit-log.js";
import { shouldBlock, mapEvent } from "./matcha-core.js";

// Re-export for backward compatibility with tests
export { DANGER_PATTERNS, checkPlanningGate };

export async function beforeToolUse(event, context) {
  if (process.env.MATCHA_SHIELD_OFF === "true") {
    const cmd = (event.input?.command || event.input?.code || "").trim();
    recordAuditLog({
      event: "SHIELD_OVERRIDE",
      actor: "environment",
      details: cmd || event?.tool || "tool-call",
      reason: process.env.MATCHA_OVERRIDE_REASON || "MATCHA_SHIELD_OFF=true active",
    }, event?.cwd);
    return null;
  }

  const toolName = event.tool || event.toolName || "";
  const input = event?.input || {};
  const cwd = event?.cwd || process.cwd();

  // Map AGY-style events if needed (for compatibility)
  const mapped = mapEvent ? mapEvent(event) : { tool: toolName, input, cwd };

  const { block, reason } = shouldBlock(mapped.tool, mapped.input, mapped.cwd, event);
  if (block) {
    recordAuditLog({
      event: "SHIELD_BLOCK",
      actor: "engine",
      details: reason || "planning-gate or danger-check",
      reason: reason || "unknown",
    }, cwd);
  }

  return { block, reason };
}