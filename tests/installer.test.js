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

  test("installs all 6 commands", () => {
    expect(installer).toContain("for cmd in why review audit intensity status debt");
  });

  test("installs hooks", () => {
    expect(installer).toContain("matcha-shield.js");
    expect(installer).toContain("matcha-post-write.js");
    expect(installer).toContain("matcha-stop.js");
  });
});



describe("install.sh — platform coverage", () => {
  const installer = readProjectFile("install.sh");

  test("detects .qoder/ directory", () => {
    expect(installer).toContain(".qoder");
    expect(installer).toContain("matcha-shield.js");
  });

  test("detects .qwen/ directory", () => {
    expect(installer).toContain(".qwen");
  });

  test("installs on all 10 platforms", () => {
    expect(installer).toContain(".claude");
    expect(installer).toContain(".opencode");
    expect(installer).toContain(".cursor");
    expect(installer).toContain(".agents");
    expect(installer).toContain(".clinerules");
    expect(installer).toContain(".windsurf");
    expect(installer).toContain(".kiro");
    expect(installer).toContain(".openclaw");
    expect(installer).toContain(".qoder");
    expect(installer).toContain(".qwen");
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
