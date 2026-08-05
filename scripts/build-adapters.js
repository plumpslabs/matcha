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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf-8");
}

function write(relPath, content) {
  const fullPath = join(ROOT, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
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

const COMMAND_NAMES = ["why", "review", "audit", "intensity", "status", "debt", "markers"];

// ─── .claude/ ────────────────────────────────────────────────────────────────

console.log("── .claude/ ──");

// CLAUDE.md — don't overwrite (user may have customizations)
// Only write if it doesn't exist
if (!existsSync(join(ROOT, ".claude/CLAUDE.md"))) {
  write(".claude/CLAUDE.md", CLAUDE_MD);
} else {
  console.log("  ✓ .claude/CLAUDE.md (exists, not overwritten)");
}

// Agents: symlink to .agents/agents/
for (const agent of AGENT_NAMES) {
  symlink(`.claude/agents/${agent}.md`, `../../.agents/agents/${agent}.md`);
}

// Skills: symlink to skills/matcha/SKILL.md (3 levels up from .claude/skills/matcha/)
symlink(".claude/skills/matcha/SKILL.md", "../../../skills/matcha/SKILL.md");

// Commands: regular files (truncated for Claude Code context window)
const CMD_MAX = 1200;
for (const cmd of COMMAND_NAMES) {
  const content = read(`commands/${cmd}.md`).trim();
  if (content.length <= CMD_MAX) {
    write(`.claude/commands/${cmd}.md`, content);
  } else {
    const truncated = content.substring(0, 1000) + "\n...\nSee commands/" + cmd + ".md for full";
    write(`.claude/commands/${cmd}.md`, truncated);
  }
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

// Skills: symlink to skills/matcha/SKILL.md (3 levels up from .opencode/skills/matcha/)
symlink(".opencode/skills/matcha/SKILL.md", "../../../skills/matcha/SKILL.md");

// Plugin stays as-is (it's OpenCode-specific)
// Don't overwrite .opencode/plugins/matcha.mjs

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

// Commands: regular files
for (const cmd of COMMAND_NAMES) {
  write(`.agents/commands/${cmd}.md`, read(`commands/${cmd}.md`));
}

console.log("");

// ─── .openclaw/ ──────────────────────────────────────────────────────────────

console.log("── .openclaw/ ──");

// Skills: symlink to canonical (3 levels up from .openclaw/skills/matcha/)
symlink(".openclaw/skills/matcha/SKILL.md", "../../../skills/matcha/SKILL.md");

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
