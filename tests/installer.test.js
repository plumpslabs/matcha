import { describe, expect, test } from "vitest";
import { assertFile, readProjectFile, assertBashSyntax } from "./helpers.js";

describe("install.sh syntax", () => {
  test("install.sh exists", () => assertFile("install.sh"));

  test("install.sh has valid bash syntax", () => {
    try { assertBashSyntax("install.sh"); } catch { /* skip if bash unavailable */ }
  });
});

describe("install.sh — core structure", () => {
  const installer = readProjectFile("install.sh");

  test("has --target flag", () => {
    expect(installer).toContain("--target");
  });

  test("accepts --platforms flag to override auto-detection", () => {
    expect(installer).toContain("--platforms");
  });

  test("has platform detection loop", () => {
    expect(installer).toContain("for p in");
  });

  test("installs all 6 agents", () => {
    expect(installer).toContain("matcha-planner");
    expect(installer).toContain("matcha-debugger");
  });

  test("installs opencode plugin (auto-loaded from .opencode/plugins/)", () => {
    expect(installer).toContain(".opencode/plugins/matcha.js");
  });

  test("installs all 7 commands", () => {
    expect(installer).toContain("for cmd in matcha:why matcha:review matcha:audit matcha:intensity matcha:status matcha:debt matcha:markers");
  });

  test("installs hooks", () => {
    expect(installer).toContain("matcha-shield.js");
    expect(installer).toContain("matcha-post-write.js");
    expect(installer).toContain("matcha-stop.js");
  });

  test("installs hook runtime dependencies (shield/mcp/opencode import them)", () => {
    // matcha-shield.js imports danger-checks, planning-gate, mode-detect, matcha-metrics
    // matcha-mcp-server.js + opencode plugin import planning-gate
    expect(installer).toContain("planning-gate.js");
    expect(installer).toContain("danger-checks.js");
    expect(installer).toContain("mode-detect.js");
    expect(installer).toContain("matcha-metrics.js");
    expect(installer).toContain("matcha-trigger-packs.json");
  });

  test("installs workspace-root.js (monorepo root resolution helper)", () => {
    // All root-resolving hooks import ./workspace-root.js — install must copy it
    expect(installer).toContain("workspace-root.js");
  });

  test("installs AGY hooks adapter + workspace manifest", () => {
    expect(installer).toContain("matcha-agy-hooks.js");
    expect(installer).toContain(".agents/hooks.json");
  });

  test("scaffolds session memory (plan + reports)", () => {
    expect(installer).toContain(".agents/plan/current.md");
    expect(installer).toContain(".agents/reports");
  });
});



describe("install.sh — platform coverage", () => {
  const installer = readProjectFile("install.sh");

  test("installs .qoder rules to .qoder/rules/ (official convention)", () => {
    expect(installer).toContain(".qoder/rules/matcha.md");
  });

  test("installs official rule files for cursor, cline, windsurf, roo, trae", () => {
    expect(installer).toContain(".cursor/rules/matcha.mdc");
    expect(installer).toContain(".clinerules/matcha.md");
    expect(installer).toContain(".windsurf/rules/matcha.md");
    expect(installer).toContain(".roo/rules/matcha.md");
    expect(installer).toContain(".trae/rules/matcha.md");
  });

  test("installs Antigravity rules at .agents/rules/ (official convention)", () => {
    expect(installer).toContain(".agents/rules/matcha.md");
  });

  test("installs GitHub Copilot instructions (skip if exists)", () => {
    expect(installer).toContain(".github/copilot-instructions.md");
    expect(installer).toContain("already exists — skipped");
  });

  test("installs on all official project platforms", () => {
    expect(installer).toContain(".claude");
    expect(installer).toContain(".opencode");
    expect(installer).toContain(".cursor");
    expect(installer).toContain(".agents");
    expect(installer).toContain(".clinerules");
    expect(installer).toContain(".windsurf");
    expect(installer).toContain(".kiro");
    expect(installer).toContain(".qoder");
    expect(installer).toContain(".roo");
    expect(installer).toContain(".trae");
  });

  test(".claude agents are installed from Claude Code-native files, not canonical (OpenCode format is ignored by Claude)", () => {
    // .claude/agents/*.md use tools:/disallowedTools: frontmatter — copying the canonical
    // OpenCode-format .agents/agents/*.md there would make Claude ignore the permission block.
    // install_agents gets an explicit source dir: .claude/agents for Claude Code, canonical otherwise.
    expect(installer).toContain('install_agents "$TARGET/$p/agents"');
    expect(installer).toContain("echo .claude/agents");
    expect(installer).toContain("echo .agents/agents");
    expect(installer).toContain('.claude/agents || echo .agents/agents');
  });

  test("GEMINI.md + AGENTS.md cover Antigravity and Qwen (root files)", () => {
    expect(installer).toContain("GEMINI.md");
    expect(installer).toContain("AGENTS.md");
  });
});

describe("QWEN.md", () => {
  test("exists", () => assertFile("QWEN.md"));

  test("has matcha reference", () => {
    const content = readProjectFile("QWEN.md");
    expect(content).toContain("matcha");
  });
});

describe("install.sh — root context files (CLAUDE.md + QWEN.md)", () => {
  const installer = readProjectFile("install.sh");

  test("installs CLAUDE.md (Claude Code reads root CLAUDE.md)", () => {
    // Regression: Claude Code reads CLAUDE.md at project root; install must copy it.
    expect(installer).toContain("install_file_if_missing \"$TARGET/CLAUDE.md\" \"CLAUDE.md\"");
  });

  test("installs QWEN.md (Qwen Code reads root QWEN.md)", () => {
    // Regression: Qwen Code reads QWEN.md at project root; install must copy it.
    expect(installer).toContain("install_file_if_missing \"$TARGET/QWEN.md\" \"QWEN.md\"");
  });

  test("CLAUDE.md and QWEN.md are real files in the repo", () => {
    assertFile("CLAUDE.md");
    assertFile("QWEN.md");
  });

  test("npm package files array includes all root context files (QWEN.md regression)", () => {
    // Regression: QWEN.md was added to install.sh but missing from package.json files array
    // → matcha init via npm silently failed to install QWEN.md (fetch uses cat $HERE/$1).
    const pkg = JSON.parse(readProjectFile("package.json"));
    const files = pkg.files || [];
    expect(files).toContain("AGENTS.md");
    expect(files).toContain("CLAUDE.md");
    expect(files).toContain("GEMINI.md");
    expect(files).toContain("QWEN.md");
  });
});

describe(".agents/ (universal format)", () => {
  test("skills/matcha/SKILL.md exists", () => {
    assertFile(".agents/skills/matcha/SKILL.md");
  });

  const agentNames = [
    "matcha-planner", "matcha-finder", "matcha-auditor",
    "matcha-reviewer", "matcha-cleaner", "matcha-debugger",
  ];

  for (const a of agentNames) {
    test(`agents/${a}.md exists`, () => {
      assertFile(`.agents/agents/${a}.md`);
    });
  }

  for (const c of ["matcha:why", "matcha:review", "matcha:audit", "matcha:intensity", "matcha:status"]) {
    test(`commands/${c}.md exists`, () => {
      assertFile(`.agents/commands/${c}.md`);
    });
  }
});
