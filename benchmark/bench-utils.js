import { execSync } from "child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export function countLOC(code) {
  return code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//")).length;
}

export function estimateTokens(code) {
  return Math.ceil(code.length / 4);
}

export function checkTool(name) {
  try {
    execSync(`which ${name} 2>/dev/null || where ${name} 2>nul`, { stdio: "pipe", timeout: 5000, encoding: "utf-8" });
    return true;
  } catch { return false; }
}

/**
 * Injects the full matcha convention into a target directory.
 * Copies the complete .claude/ folder (settings.json + skills + agents)
 * and the hooks/ directory so hooks (shield, post-write, stop) are available.
 * This replaces the old behavior that only wrote a minimal CLAUDE.md template.
 */
export function injectMatchaRules(dir) {
  const srcClaude = join(ROOT, ".claude");
  const srcHooks = join(ROOT, "hooks");
  const dstClaude = join(dir, ".claude");
  const dstHooks = join(dir, "hooks");

  // Copy .claude/ folder (settings.json, skills, agents)
  if (existsSync(srcClaude)) {
    cpSync(srcClaude, dstClaude, { recursive: true, force: true });
  }

  // Copy hooks/ folder (shield.js, post-write.js, stop.js, etc.)
  if (existsSync(srcHooks)) {
    cpSync(srcHooks, dstHooks, { recursive: true, force: true });
  }
}

/**
 * Injects matcha in the format opencode reads: .opencode/ + .agents/ (canonical
 * OpenCode agent format per install.sh) + hooks/ + root AGENTS.md/CLAUDE.md.
 * Skips .opencode/node_modules (plugin has no runtime deps when loaded by opencode).
 */
export function injectOpenCodeRules(dir) {
  const copyDir = (name) => {
    const src = join(ROOT, name);
    const dst = join(dir, name);
    if (existsSync(src)) cpSync(src, dst, { recursive: true, force: true });
  };

  copyDir(".opencode");
  copyDir(".agents");
  copyDir("hooks");

  for (const f of ["AGENTS.md", "CLAUDE.md", "QWEN.md", "GEMINI.md"]) {
    const src = join(ROOT, f);
    if (existsSync(src)) cpSync(src, join(dir, f), { force: true });
  }

  // Drop heavy/unneeded artifacts from the injected copy
  for (const p of [
    join(dir, ".opencode/node_modules"),
    join(dir, ".opencode/package-lock.json"),
    join(dir, ".opencode/.gitignore"),
  ]) {
    try { rmSync(p, { recursive: true, force: true }); } catch {}
  }
}

/**
 * Removes a path WITHOUT ever following a symlink to its target — if `p` is a
 * symlink (the injected skill dirs point back at the real matcha repo via
 * cpSync-resolved absolute links), only the link is removed, never the repo.
 */
function removePathSafe(p) {
  try {
    const st = lstatSync(p);
    if (st.isSymbolicLink()) unlinkSync(p);
    else rmSync(p, { recursive: true, force: true });
  } catch {}
}

/**
 * Injects matcha in "core-only" mode for the A/B benchmark arm (matcha-lite):
 * same as injectOpenCodeRules, but the skill is replaced with a self-contained
 * tree containing ONLY SKILL.md (lite index) + modules/core.md. Measures the
 * standing-context cost of the non-core modules (engineering/risk/modes/legacy).
 */
export function injectOpenCodeRulesLite(dir) {
  injectOpenCodeRules(dir);

  const liteSkill = [
    "---",
    "name: matcha",
    "description: Engineering philosophy ruleset — core module only (benchmark lite variant).",
    "---",
    "",
    "# 🍵 matcha — Core Only",
    "",
    "Only `modules/core.md` is available in this variant. Read it. All other modules are intentionally absent — do not attempt to load them.",
    "",
    "## Module Index",
    "| Module | When to Load |",
    "|--------|-------------|",
    "| `modules/core.md` | **Always** (default) |",
  ].join("\n");

  for (const rel of [".opencode/skills/matcha", ".agents/skills/matcha"]) {
    const base = join(dir, rel);
    if (!existsSync(base)) continue;
    removePathSafe(join(base, "SKILL.md"));
    removePathSafe(join(base, "modules"));
    mkdirSync(join(base, "modules"), { recursive: true });
    writeFileSync(join(base, "SKILL.md"), liteSkill, "utf-8");
    writeFileSync(
      join(base, "modules/core.md"),
      readFileSync(join(ROOT, "skills/matcha/modules/core.md"), "utf-8"),
      "utf-8",
    );
  }
}
