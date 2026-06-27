import { describe, expect, test } from "vitest";
import { readProjectFile, assertFile } from "./helpers.js";

describe("OpenCode plugin", () => {
  const content = readProjectFile(".opencode/plugins/matcha.mjs");

  test("no longer has prompt-based 'surface 3' instruction", () => {
    expect(content).not.toContain("surface 3 matcha suggestions");
  });

  test("has lifecycle hooks (before + created)", () => {
    expect(content).toContain("tool.execute.before");
    expect(content).toContain("session.created");
  });

  test("does not have no-op after hook", () => {
    expect(content).not.toContain("tool.execute.after");
  });
});

describe("CLAUDE.md cleanup", () => {
  const content = readProjectFile("CLAUDE.md");

  test("no longer has End-of-Task prompt instruction", () => {
    expect(content).not.toContain("End-of-Task");
  });
});

describe("Kiro steering", () => {
  const content = readProjectFile(".kiro/steering/matcha.md");

  test("uses inclusion: always", () => {
    expect(content).toContain("inclusion: always");
  });

  test("no Cursor-specific alwaysApply", () => {
    expect(content).not.toContain("alwaysApply");
  });

  test("no Cursor-specific globs", () => {
    expect(content).not.toContain("globs");
  });
});

describe("Cursor rules", () => {
  const scopedFiles = [
    "matcha-core.mdc", "matcha-cleanup.mdc",
    "matcha-audit.mdc", "matcha-review.mdc",
  ];
  test.each(scopedFiles)("cursor/rules/%s exists", (f) => {
    assertFile(`.cursor/rules/${f}`);
  });
});

describe("Windsurfrules", () => {
  test("exists at root", () => assertFile(".windsurfrules"));

  test("contains matcha + 5W1H Gate", () => {
    const content = readProjectFile(".windsurfrules");
    expect(content).toContain("matcha");
    expect(content).toContain("5W1H Gate");
  });
});
