import { describe, expect, test } from "vitest";
import { assertFile, readProjectFile, assertValidSyntax } from "./helpers.js";

describe("bin/matcha.js", () => {
  test("exists", () => assertFile("bin/matcha.js"));

  test("has valid Node syntax", () => assertValidSyntax("bin/matcha.js"));

  const content = readProjectFile("bin/matcha.js");

  test("has init command referencing install.sh", () => {
    expect(content).toContain("init");
    expect(content).toContain("install.sh");
  });

  test("has status command with Platform detection", () => {
    expect(content).toContain("status");
    expect(content).toContain("Platform:");
  });

  test("has why command with 5W1H", () => {
    expect(content).toContain("5W1H");
  });

  test("has audit command with Stack Audit", () => {
    expect(content).toContain("Stack Audit");
  });

  test("has verify command with Feedback Harness", () => {
    expect(content).toContain("verify");
    expect(content).toContain("Feedback Harness");
  });

  test("detects package.json test script", () => {
    expect(content).toContain('"test"');
  });

  test("detects Go test", () => {
    expect(content).toContain("go test ./...");
  });
});
