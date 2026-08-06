/**
 * 🍵 matcha — workspace-root.js
 * Monorepo-aware workspace root resolution.
 *
 * Hooks historically used `process.cwd()` as ROOT. That breaks when an agent
 * is launched from a sub-project (e.g. `crm_sales_backend/`) inside a monorepo:
 * the hook then looks for `.agents/` relative to the sub-project and can't find
 * the plan/state/metrics that live at the workspace root — causing false
 * "Planning Gate Blocked" and lost state.
 *
 * This helper walks UP from cwd until a directory containing `.agents/` is
 * found, and falls back to cwd when none exists (fresh/non-matcha folders).
 *
 * Exports:
 *   getWorkspaceRoot(cwd?) — nearest ancestor containing `.agents` (or cwd)
 */

import { existsSync } from "fs";
import { join, dirname, resolve } from "path";


/**
 * Resolve the workspace root by walking up from `cwd` until a directory
 * containing `.agents/` is found. Falls back to `cwd`.
 * @param {string} [cwd] — starting directory (defaults to process.cwd())
 * @returns {string} absolute workspace root path
 */
export function getWorkspaceRoot(cwd = process.cwd()) {
  let dir = resolve(cwd);
  while (dir && dir !== dirname(dir)) {
    if (existsSync(join(dir, ".agents"))) return dir;
    dir = dirname(dir);
  }
  return resolve(cwd);
}

