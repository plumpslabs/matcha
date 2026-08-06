/**
 * 🍵 matcha — command-truncate.js
 * Single source of truth for the .claude/commands truncation rule.
 *
 * .claude/commands copies are truncated for Claude Code's context window.
 * The rule must be identical everywhere it is applied, so it lives here once:
 *   - scripts/build-adapters.js   (generates the copies)
 *   - scripts/check-rule-copies.js (verifies them)
 *   - tests/symmetry.test.js      (regression-guards them)
 *
 * Change CMD_MAX / CMD_HEAD here and rebuild with `node scripts/build-adapters.js`.
 */

export const CMD_MAX = 1200;
export const CMD_HEAD = 1000;

/**
 * Applies the truncation rule to a canonical command file's content.
 * @param {string} content - canonical content (already trimmed)
 * @param {string} cmd - command name, e.g. "matcha:audit"
 * @returns {string} the exact content the .claude copy must have
 */
export function truncateCommand(content, cmd) {
  if (content.length <= CMD_MAX) return content;
  return content.substring(0, CMD_HEAD) + `\n...\nSee commands/${cmd}.md for full`;
}
