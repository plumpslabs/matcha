/**
 * 🍵 matcha — Research Reference Ledger
 *
 * Never Twice for research: validated sources persist per-topic in
 * `.agents/research/<topic>.md` (indexed by `index.md`), misleading ones in
 * `.agents/research/unreliable.md`. The researcher checks the ledger BEFORE
 * fan-out — a fresh answer already on file means zero scouts spawned.
 *
 * Line formats:
 *   references:  - [URL] — grounded: <what> (YYYY-MM-DD)
 *   unreliable:  - [URL] — blocked: <reason> (YYYY-MM-DD)
 *
 * Used by:
 *   - MCP tool `matcha_research_lookup`
 *   - unit tests (tests/hook-modules.test.js)
 */

export const LEDGER_PATH = ".agents/reports/references.md";
export const UNRELIABLE_PATH = ".agents/reports/unreliable.md";

// v2 folder layout (bounded reads): index first, then only matched files.
export const RESEARCH_DIR = ".agents/research";
export const INDEX_PATH = ".agents/research/index.md";
export const UNRELIABLE_V2_PATH = ".agents/research/unreliable.md";
export const MAX_TOPIC_FILES_PER_LOOKUP = 2;

/** Normalize a URL for dedupe (case + trailing slash). */
export function normalizeUrl(url) {
  return String(url || "").trim().replace(/\/$/, "").toLowerCase();
}

/**
 * Parse ledger lines into entries.
 * @param {string} content
 * @returns {Array<{url: string, note: string, date: ?string}>}
 */
export function parseLedger(content) {
  const out = [];
  for (const line of String(content || "").split("\n")) {
    const m = line.match(/^\s*-\s*\[(https?:\/\/[^\]]+)\]\s*[—-]\s*(.+)$/);
    if (!m) continue;
    const rest = m[2].trim();
    const dateMatch = rest.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/);
    out.push({
      url: m[1].trim(),
      note: dateMatch ? rest.slice(0, dateMatch.index).trim() : rest,
      date: dateMatch ? dateMatch[1] : null,
    });
  }
  return out;
}

/**
 * Format one ledger entry line.
 */
export function formatEntry(url, kind, note, date) {
  const label = kind === "blocked" ? "blocked" : "grounded";
  const stamp = date || new Date().toISOString().slice(0, 10);
  return `- [${url}] — ${label}: ${note} (${stamp})`;
}

/**
 * Add an entry unless the URL is already listed. Returns updated content
 * or null when duplicate.
 */
export function addEntry(content, url, kind, note, date) {
  const norm = normalizeUrl(url);
  if (!norm) return null;
  for (const e of parseLedger(content)) {
    if (normalizeUrl(e.url) === norm) return null;
  }
  const base = String(content || "").trimEnd();
  return (base ? base + "\n" : "") + formatEntry(url.trim(), kind, note, date) + "\n";
}

/**
 * Check whether a URL is blocklisted.
 */
export function isBlocked(content, url) {
  const norm = normalizeUrl(url);
  return parseLedger(content).some((e) => normalizeUrl(e.url) === norm);
}

/**
 * Rank ledger entries by keyword overlap with the query. Returns best-first,
 * capped at limit. Zero-token when irrelevant: empty array, no scouts.
 */
export function findRelevant(content, query, limit = 5) {
  const words = String(query || "").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return [];
  const scored = [];
  for (const e of parseLedger(content)) {
    const hay = `${e.url} ${e.note}`.toLowerCase();
    let n = 0;
    for (const w of words) {
      if (hay.includes(w)) n++;
    }
    if (n > 0) scored.push({ entry: e, score: n });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit > 0 ? limit : 5).map((s) => s.entry);
}

/**
 * Parse the topic index into [{topic, file}].
 * Line format: - [topic slug] — path/to/file.md
 */
export function parseIndex(content) {
  const out = [];
  for (const line of String(content || "").split("\n")) {
    const m = line.match(/^\s*-\s*\[(.+?)\]\s*[—-]\s*(\S+\.md)\s*$/);
    if (m) out.push({ topic: m[1].trim(), file: m[2].trim() });
  }
  return out;
}

/**
 * Match index topics to a query by keyword overlap. Returns best-first.
 */
export function matchTopics(entries, query, limit = MAX_TOPIC_FILES_PER_LOOKUP) {
  const words = String(query || "").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return [];
  const scored = [];
  for (const e of entries) {
    const hay = e.topic.toLowerCase();
    let n = 0;
    for (const w of words) {
      if (hay.includes(w)) n++;
    }
    if (n > 0) scored.push({ entry: e, score: n });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit > 0 ? limit : MAX_TOPIC_FILES_PER_LOOKUP).map((s) => s.entry);
}

/**
 * Sweep stale entries (dated, older than maxAgeDays) for re-research triage.
 * @returns {Array} stale entries
 */
export function sweepStale(content, maxAgeDays = 180, now = new Date()) {
  return parseLedger(content).filter((e) => isStale(e, maxAgeDays, now));
}
export function isStale(entry, maxAgeDays, now = new Date()) {
  if (!entry || !entry.date) return false;
  const t = Date.parse(entry.date);
  if (Number.isNaN(t)) return false;
  return now.getTime() - t > maxAgeDays * 86400000;
}
