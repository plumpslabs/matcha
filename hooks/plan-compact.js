/**
 * 🍵 matcha — plan-compact.js
 * Plan auto-compaction + resume hint (issue #3 P1/P2).
 * Pure functions: compactPlan, getPlanResumeHint. No side effects.
 */

/**
 * Compact a plan: archive completed [x] steps into an archive block,
 * keep intent, unchecked steps, Current marker, risks.
 * @param {string} content - current.md content
 * @param {number} threshold - min completed steps before compacting (default 5)
 * @returns {{compacted: boolean, content: string, archived: string}}
 */
export function compactPlan(content, threshold = 5) {
  const s = String(content || "");
  const doneLines = s.split("\n").filter((l) => /^- \[x\] Step/i.test(l));
  if (doneLines.length < threshold) return { compacted: false, content: s, archived: "" };

  const archived = doneLines.join("\n");
  const lines = s.split("\n").filter((l) => !/^- \[x\] Step/i.test(l));
  const stamp = `\n> _Compacted ${new Date().toISOString().slice(0, 10)}: ${doneLines.length} finished steps archived to reports/planner-<YYYY-MM>.md._\n`;
  // Insert stamp after frontmatter or at top
  let out = lines.join("\n");
  if (/^---\n[\s\S]*?\n---/.test(out)) {
    out = out.replace(/(^---\n[\s\S]*?\n---)/, `$1${stamp}`);
  } else {
    out = stamp + out;
  }
  return { compacted: true, content: out, archived };
}

/**
 * One-line resume hint for session-start injection: `plan: Step 8/11 - <title>`.
 * @param {string} content - current.md content
 * @returns {string|null}
 */
export function getPlanResumeHint(content) {
  const s = String(content || "");
  if (!s.trim()) return null;
  const titleMatch = s.match(/^title:\s*(.+)$/im);
  const title = titleMatch ? titleMatch[1].trim() : "untitled";
  const total = (s.match(/^- \[[ x]\] Step/gim) || []).length;
  const done = (s.match(/^- \[x\] Step/gim) || []).length;
  if (total === 0) return `plan: ${title} (no steps)`;
  const curMatch = s.match(/\*\*▶ Current:\*\*[^\n]*?(\d+)\/(\d+)/);
  const cur = curMatch ? `Step ${curMatch[1]}/${curMatch[2]}` : `Step ${done + 1}/${total}`;
  return `plan: ${cur} — ${title}`;
}

/**
 * Tombstone written to current.md after a PASS archive (issue #4).
 * Distinguishes "plan archived, start fresh" from "no plan yet": the gate
 * rejects tombstoned plans with an archive-aware message instead of letting
 * a stale body pass validation.
 * @param {string} archivedTo - reports path the plan was archived to
 * @returns {string} tombstone file content
 */
export function writeTombstone(archivedTo) {
  const today = new Date().toISOString().slice(0, 10);
  return `---\ntitle: (archived — start fresh)\ndate: ${today}\ntype: plan\nstatus: archived\narchived-to: ${archivedTo}\n---\n# 🍵 Intent Discovery — Archived\n\n> Previous plan archived to \`${archivedTo}\` on ${today} after review PASS.\n> This is NOT an active plan — overwrite this file with fresh Intent Discovery for the new task.\n\n- **Problem:** (TBD — write fresh plan)\n- **Goals:** (TBD)\n- **Success Criteria:** (TBD)\n`;
}

/** Extract the archived-to path from a tombstoned plan, or null. */
export function getArchivedTo(content) {
  const m = String(content || "").match(/^archived-to:\s*(.+)$/im);
  return m ? m[1].trim() : null;
}
