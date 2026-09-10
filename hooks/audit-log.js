/**
 * 🍵 matcha — audit-log.js
 * Tamper-evident, structured audit logger for governance events,
 * shield overrides (MATCHA_SHIELD_OFF), state toggles (matcha on/off),
 * and critical bypasses.
 *
 * Log path: <workspace_root>/.agents/audit.log
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "./workspace-root.js";

export function getAuditLogPath(cwd) {
  const root = getWorkspaceRoot(cwd);
  return join(root, ".agents", "audit.log");
}

/**
 * Record an audit event.
 * @param {{
 *   event: string,           // e.g. "SHIELD_OVERRIDE", "TOGGLE_STATE", "PLANNING_BYPASS"
 *   actor?: string,          // e.g. "developer", "ai-agent", process.env.USER
 *   details?: string|object, // Context or command executed
 *   reason?: string          // Explicit rationale or ticket ID
 * }} param0
 * @param {string} [cwd]
 */
export function recordAuditLog({ event, actor, details, reason }, cwd) {
  try {
    const logPath = getAuditLogPath(cwd);
    const dir = join(logPath, "..");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const who = actor || process.env.USER || process.env.USERNAME || "unknown";
    const detailStr = typeof details === "object" ? JSON.stringify(details) : (details || "-");
    const reasonStr = reason || process.env.MATCHA_OVERRIDE_REASON || "No reason provided";

    const entry = `[${timestamp}] [${event}] actor=${who} | reason="${reasonStr}" | details=${detailStr}\n`;
    appendFileSync(logPath, entry, "utf-8");
  } catch {
    // Fail-open for logging errors to prevent bricking the agent
  }
}

/**
 * Read recent audit logs.
 * @param {number} limit
 * @param {string} [cwd]
 * @returns {string[]}
 */
export function getRecentAuditLogs(limit = 20, cwd) {
  try {
    const logPath = getAuditLogPath(cwd);
    if (!existsSync(logPath)) return [];
    const raw = readFileSync(logPath, "utf-8").trim();
    if (!raw) return [];
    const lines = raw.split("\n").filter(Boolean);
    return lines.slice(-limit);
  } catch {
    return [];
  }
}
