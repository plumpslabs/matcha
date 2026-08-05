import { describe, expect, test } from "vitest";
import { readProjectFile, assertFile } from "./helpers.js";

describe("OpenCode plugin", () => {
  const content = readProjectFile(".opencode/plugins/matcha.js");

  test("uses factory-function format (opencode v1.18+ — export default no longer loads)", () => {
    expect(content).toContain("export const MatchaPlugin = async");
    expect(content).not.toContain("export default {");
  });

  test("reads tool args from output.args (official location), not input.args", () => {
    expect(content).toContain("output.args");
    expect(content).not.toContain("input.args");
  });

  test("has tool.execute.before hook for shield + planning gate", () => {
    expect(content).toContain("tool.execute.before");
  });

  test("no longer relies on dead session.created { system } injection", () => {
    expect(content).not.toContain("session.created");
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



describe("Windsurfrules", () => {
  test("exists at root", () => assertFile(".windsurfrules"));

  test("contains matcha + Intent Discovery", () => {
    const content = readProjectFile(".windsurfrules");
    expect(content).toContain("matcha");
    expect(content).toContain("Intent Discovery");
  });
});
