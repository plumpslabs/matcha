#!/usr/bin/env node
/**
 * 🍵 matcha — build-adapters.js
 * Generates all platform-specific files from source of truth.
 *
 * Source of truth:
 *   - AGENTS.md (primary cross-tool file)
 *   - skills/matcha/SKILL.md (full philosophy, modular)
 *   - skills/matcha/modules/*.md (modular skill components)
 *   - commands/*.md (slash commands)
 *   - hooks/*.js (lifecycle hooks)
 *
 * Generated:
 *   - .claude/ (Claude Code)
 *   - .opencode/ (OpenCode)
 *   - .agents/ (Universal fallback)
 *   - .openclaw/ (OpenClaw)
 *   - .kiro/ (Kiro)
 *   - .windsurfrules (Windsurf)
 *   - GEMINI.md (Antigravity)
 *
 * Run: node scripts/build-adapters.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, symlinkSync, rmSync, lstatSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { truncateCommand } from "./command-truncate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf-8");
}

function write(relPath, content) {
  const fullPath = join(ROOT, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  // Never write THROUGH a stale symlink (would corrupt its target — e.g. a
  // previously-symlinked .claude/agents/*.md pointing at the canonical file).
  // Remove the link first so we create a real file.
  try {
    if (lstatSync(fullPath).isSymbolicLink()) rmSync(fullPath);
  } catch {}
  writeFileSync(fullPath, content, "utf-8");
  console.log(`  ✓ ${relPath}`);
}

function symlink(relPath, target) {
  const fullPath = join(ROOT, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  try { rmSync(fullPath); } catch {}
  try { rmSync(fullPath, { recursive: true }); } catch {}
  symlinkSync(target, fullPath);
  console.log(`  ✓ ${relPath} → ${target}`);
}

function ensureDir(relPath) {
  mkdirSync(join(ROOT, relPath), { recursive: true });
}

// Remove command files that used the old non-namespaced names (pre-v2.5.15),
// so platforms never expose BOTH /why and /matcha:why.
const LEGACY_COMMAND_NAMES = ["why", "review", "audit", "intensity", "status", "debt", "markers"];
function cleanLegacyCommands(relDir) {
  for (const legacy of LEGACY_COMMAND_NAMES) {
    const p = join(ROOT, relDir, `${legacy}.md`);
    if (existsSync(p)) {
      rmSync(p);
      console.log(`  🧹 removed legacy ${relDir}/${legacy}.md`);
    }
  }
}

console.log("🍵 matcha — building all adapters...\n");

// ─── Source files ────────────────────────────────────────────────────────────

const AGENTS_MD = read("AGENTS.md");
const SKILL_MD = read("skills/matcha/SKILL.md");
const CLAUDE_MD = read("CLAUDE.md");
const GEMINI_MD_CONTENT = read("GEMINI.md");
const WINDSURF_CONTENT = read(".windsurfrules");

const AGENT_NAMES = [
  "matcha-planner", "matcha-finder", "matcha-auditor",
  "matcha-reviewer", "matcha-cleaner", "matcha-debugger",
];

const COMMAND_NAMES = [
  "matcha:why", "matcha:review", "matcha:audit", "matcha:intensity",
  "matcha:status", "matcha:debt", "matcha:markers",
];

// ─── Claude Code agent frontmatter transform ────────────────────────────────
// OpenCode `permission:` block → Claude Code `tools:` allowlist + `disallowedTools:`.
// Claude Code has no per-path or per-command bash patterns; the prompt body (kept intact)
// carries the finer guidance. Tool names are Claude Code's: Read, Grep, Glob, List, Bash,
// Edit, Write, Task, WebFetch, WebSearch.
function toClaudeFormat(canonical, agent) {
  const lines = canonical.split("\n");
  const body = canonical.slice(canonical.indexOf("---", canonical.indexOf("---") + 1) + 4);
  const fm = canonical.slice(0, canonical.indexOf("---", 3));

  // Parse permission flags from the canonical frontmatter (name: <tool>: allow lines).
  const allow = new Set();
  const deny = new Set();
  const map = {
    read: "Read", grep: "Grep", glob: "Glob", list: "List",
    webfetch: "WebFetch", websearch: "WebSearch", task: "Task",
  };
  const fmLines = fm.split("\n");
  for (let i = 0; i < fmLines.length; i++) {
    const line = fmLines[i].trim();
    if (line === "bash: allow" || line === "bash:") { allow.add("Bash"); continue; }
    if (line === "edit: allow") { allow.add("Edit"); allow.add("Write"); continue; }
    if (line.startsWith("edit:") && !line.includes("allow")) {
      // path-scoped edit (e.g. only reports) — Claude Code can't express this;
      // keep the tool but the prompt body restricts usage.
      if (/"[^"]*\.md"/.test(line) || /reports|current\.md/.test(line)) allow.add("Edit");
      continue;
    }
    const m = line.match(/^(\w+):\s*(allow|deny)$/);
    if (m && map[m[1]]) {
      if (m[2] === "allow") allow.add(map[m[1]]);
      else deny.add(map[m[1]]);
    }
  }
  if (allow.has("Edit")) allow.add("Write");

  const tools = ["Read", "Grep", "Glob", "List"].concat(
    allow.has("Bash") ? ["Bash"] : [],
    allow.has("Edit") ? ["Edit", "Write"] : []
  ).filter((t, i, a) => a.indexOf(t) === i);
  const disallowed = [...deny].filter(t => !tools.includes(t));
  if (!allow.has("Edit")) disallowed.push("Edit", "Write");

  return [
    "---",
    `name: ${agent}`,
    `description: ${fm.match(/description:\s*(.+)/)?.[1]?.trim() ?? ""}`,
    `tools: ${tools.join(", ")}`,
    `disallowedTools: ${disallowed.length ? disallowed.join(", ") : "none"}`,
    "permissionMode: default",
    "---",
    body.trim(),
    "",
  ].join("\n");
}

// ─── .claude/ ────────────────────────────────────────────────────────────────

console.log("── .claude/ ──");

// CLAUDE.md — don't overwrite (user may have customizations)
// Only write if it doesn't exist
if (!existsSync(join(ROOT, ".claude/CLAUDE.md"))) {
  write(".claude/CLAUDE.md", CLAUDE_MD);
} else {
  console.log("  ✓ .claude/CLAUDE.md (exists, not overwritten)");
}

// Agents: REAL FILES in Claude Code's native format.
// Claude Code does NOT support OpenCode's `mode:`/`permission:` frontmatter keys — it uses
// `tools:` (allowlist) + `disallowedTools:` + `permissionMode:`. A symlink to the canonical
// OpenCode-format file would make Claude ignore `permission:` entirely (no read-only
// enforcement, no bash whitelist) — misleading. So we transform the frontmatter here,
// and must REMOVE any stale symlink first (writeFileSync would otherwise write THROUGH
// the symlink into the canonical file, corrupting it).
for (const agent of AGENT_NAMES) {
  const p = join(ROOT, `.claude/agents/${agent}.md`);
  try {
    if (lstatSync(p).isSymbolicLink()) rmSync(p);
  } catch {}
  write(`.claude/agents/${agent}.md`, toClaudeFormat(read(`.agents/agents/${agent}.md`), agent));
}

// Skills: symlink to skills/matcha/SKILL.md (3 levels up from .claude/skills/matcha/)
symlink(".claude/skills/matcha/SKILL.md", "../../../skills/matcha/SKILL.md");
symlink(".claude/skills/matcha/modules", "../../../skills/matcha/modules");

// Commands: regular files (truncated for Claude Code context window)
// Truncation rule lives in scripts/command-truncate.js — single source of truth.
cleanLegacyCommands(".claude/commands");
for (const cmd of COMMAND_NAMES) {
  write(`.claude/commands/${cmd}.md`, truncateCommand(read(`commands/${cmd}.md`).trim(), cmd));
}

// Settings: use safe merge (don't overwrite existing hooks)
// The safe-merge-settings.js script handles this separately

console.log("");

// ─── .opencode/ ──────────────────────────────────────────────────────────────

console.log("── .opencode/ ──");

// Agents: symlink to .agents/agents/
for (const agent of AGENT_NAMES) {
  symlink(`.opencode/agents/${agent}.md`, `../../.agents/agents/${agent}.md`);
}

// Commands: regular files (opencode scans .opencode/commands/)
cleanLegacyCommands(".opencode/commands");
for (const cmd of COMMAND_NAMES) {
  write(`.opencode/commands/${cmd}.md`, read(`commands/${cmd}.md`));
}

// Skills: symlink to skills/matcha/SKILL.md (3 levels up from .opencode/skills/matcha/)
symlink(".opencode/skills/matcha/SKILL.md", "../../../skills/matcha/SKILL.md");
symlink(".opencode/skills/matcha/modules", "../../../skills/matcha/modules");

// Plugin stays as-is (it's OpenCode-specific)
// Don't overwrite .opencode/plugins/matcha.js

console.log("");

// ─── .agents/ ────────────────────────────────────────────────────────────────

console.log("── .agents/ ──");

// Agents: canonical source (regular files, not symlinks)
for (const agent of AGENT_NAMES) {
  // Read from canonical source (or through .claude/ symlink)
  const source = existsSync(join(ROOT, `.agents/agents/${agent}.md`))
    ? `.agents/agents/${agent}.md`
    : `.claude/agents/${agent}.md`;
  write(`.agents/agents/${agent}.md`, read(source));
}

// Skills: symlink to canonical
symlink(".agents/skills/matcha/SKILL.md", "../../../skills/matcha/SKILL.md");
symlink(".agents/skills/matcha/modules", "../../../skills/matcha/modules");

// Commands: regular files
cleanLegacyCommands(".agents/commands");
for (const cmd of COMMAND_NAMES) {
  write(`.agents/commands/${cmd}.md`, read(`commands/${cmd}.md`));
}

// AGY hooks manifest (workspace scope: <project>/.agents/hooks.json)
write(".agents/hooks.json", read("hooks.json"));

console.log("");

// ─── .openclaw/ ──────────────────────────────────────────────────────────────

console.log("── .openclaw/ ──");

// Skills: symlink to canonical (3 levels up from .openclaw/skills/matcha/)
symlink(".openclaw/skills/matcha/SKILL.md", "../../../skills/matcha/SKILL.md");
symlink(".openclaw/skills/matcha/modules", "../../../skills/matcha/modules");

console.log("");

// ─── .kiro/ ──────────────────────────────────────────────────────────────────

console.log("── .kiro/ ──");

// Kiro steering files are unique to Kiro — don't overwrite
// But ensure they exist
const kiroFiles = ["matcha.md", "dev-mode.md", "review-mode.md"];
for (const f of kiroFiles) {
  if (!existsSync(join(ROOT, `.kiro/steering/${f}`))) {
    console.log(`  ⚠ Missing .kiro/steering/${f} — skipping (must be created manually)`);
  } else {
    console.log(`  ✓ .kiro/steering/${f} (exists)`);
  }
}

console.log("");

// ─── agents/ (AGY plugin subagents) ───────────────────────────────────────────

console.log("── agents/ (AGY plugin) ──");

// AGY (Antigravity CLI) scans the root-level `agents/` dir of a plugin repo.
// Real files (not symlinks — npm-packlist skips symlinks).
for (const agent of AGENT_NAMES) {
  write(`agents/${agent}.md`, read(`.agents/agents/${agent}.md`));
}

// ─── rules/ (AGY plugin rules) ─────────────────────────────────────────────────

console.log("── rules/ (AGY plugin) ──");

// AGY plugin structure scans a root-level `rules/` dir for custom codebase rules.
write("rules/matcha.md", read(".agents/rules/matcha.md"));

console.log("");

// ─── mcp_config.json (AGY plugin MCP) ─────────────────────────────────────────

console.log("── mcp_config.json (AGY plugin) ──");

// AGY reads root-level `mcp_config.json` for plugin MCP servers.
write("mcp_config.json", JSON.stringify({
  mcpServers: {
    matcha: {
      command: "node",
      args: ["hooks/matcha-mcp-server.js"],
      env: {},
    },
  },
}, null, 2) + "\n");

console.log("");

// ─── Root platform files ─────────────────────────────────────────────────────

console.log("── Root platform files ──");

// .windsurfrules — update from source
write(".windsurfrules", WINDSURF_CONTENT);

// GEMINI.md — update from source
write("GEMINI.md", GEMINI_MD_CONTENT);

// AGENTS.md — don't overwrite if user has customized it
const agentsMdPath = join(ROOT, "AGENTS.md");
if (existsSync(agentsMdPath)) {
  const existing = readFileSync(agentsMdPath, "utf-8");
  if (existing.includes("matcha") && existing.length > 500) {
    console.log("  ✓ AGENTS.md (exists, kept as-is — user may have customized)");
  } else {
    write("AGENTS.md", AGENTS_MD);
  }
} else {
  write("AGENTS.md", AGENTS_MD);
}

console.log("");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log("✅ All adapters built from source of truth.\n");
console.log("Source files:");
console.log("  AGENTS.md → primary cross-tool file");
console.log("  skills/matcha/SKILL.md → full philosophy (modular)");
console.log("  skills/matcha/modules/*.md → modular components");
console.log("  commands/*.md → slash commands");
console.log("  hooks/*.js → lifecycle hooks");
console.log("");
console.log("Generated platforms:");
console.log("  .claude/ (symlinks → .agents/ + skills/)");
console.log("  .opencode/ (symlinks → .agents/ + skills/)");
console.log("  .agents/ (canonical agent/command files)");
console.log("  .openclaw/ (symlink → skills/)");
console.log("  .kiro/ (platform-specific, not overwritten)");
console.log("  agents/ (AGY plugin subagents — real files)");
console.log("  mcp_config.json (AGY plugin MCP server)");
console.log("  .windsurfrules (from source)");
console.log("  GEMINI.md (from source)");
