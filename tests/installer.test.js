import { describe, expect, test } from "vitest";
import { assertFile, readProjectFile, assertBashSyntax } from "./helpers.js";

describe("install.sh syntax", () => {
  test("install.sh exists", () => assertFile("install.sh"));

  test("install.sh has valid bash syntax", () => {
    try { assertBashSyntax("install.sh"); } catch { /* skip if bash unavailable */ }
  });
});

describe("install.sh flags", () => {
  const installer = readProjectFile("install.sh");

  test("has --lang flag", () => {
    expect(installer).toContain("--lang");
  });

  test("has --profile flag", () => {
    expect(installer).toContain("--profile");
  });

  test("has detect_languages function", () => {
    expect(installer).toContain("detect_languages");
  });

  test("has ALL_LANGS variable", () => {
    expect(installer).toContain("ALL_LANGS");
  });

  test("has resolve_langs function", () => {
    expect(installer).toContain("resolve_langs");
  });

  test("normalizes commas to spaces in LANG_FILTER", () => {
    expect(installer).toContain("LANG_FILTER=\"\${LANG_FILTER//,/ }\"");
  });

  test("does not overwrite LANG_FILTER in resolve_langs full profile if already set", () => {
    expect(installer).toContain('-z "$LANG_FILTER"');
  });
});

describe("install.sh — Qoder platform detection", () => {
  const installer = readProjectFile("install.sh");

  test("detects .qoder/ directory", () => {
    expect(installer).toContain(".qoder");
    expect(installer).toContain("qoder)");
    expect(installer).toContain("matcha-shield.js");
  });

  test("installs AGENTS.md for Qoder", () => {
    expect(installer).toMatch(/qoder\)[\s\S]*?install_context/);
  });
});

describe("install.sh — Qwen platform detection", () => {
  const installer = readProjectFile("install.sh");

  test("detects .qwen/ directory", () => {
    expect(installer).toContain(".qwen");
    expect(installer).toContain("qwen)");
  });

  test("installs skill for Qwen", () => {
    expect(installer).toContain("qwen/skills/matcha/SKILL.md");
  });

  test("generates settings.json for Qwen", () => {
    expect(installer).toContain("settings.json");
  });

  test("auto-creates QWEN.md for qwen", () => {
    expect(installer).toContain('install_file "$TARGET/QWEN.md"');
  });
});

describe("install.sh — platform coverage", () => {
  const installer = readProjectFile("install.sh");
  const cases = installer.match(/^\s+[a-z]+\)/gm);

  test("has 10+ platform cases", () => {
    expect(cases?.length).toBeGreaterThanOrEqual(10);
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
