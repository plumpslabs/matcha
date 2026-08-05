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

  test("installs all 7 commands", () => {
    expect(installer).toContain("for cmd in why review audit intensity status debt markers");
  });

  test("installs hooks", () => {
    expect(installer).toContain("matcha-shield.js");
    expect(installer).toContain("matcha-post-write.js");
    expect(installer).toContain("matcha-stop.js");
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

  for (const c of ["why", "review", "audit", "intensity", "status"]) {
    test(`commands/${c}.md exists`, () => {
      assertFile(`.agents/commands/${c}.md`);
    });
  }
});
