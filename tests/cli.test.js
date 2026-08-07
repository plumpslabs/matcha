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

  test("has --platforms flag for scripted provider selection", () => {
    expect(content).toContain("--platforms");
    expect(content).toContain(".opencode,.claude");
  });

  test("has status command with Platform detection", () => {
    expect(content).toContain("status");
    expect(content).toContain("Platform:");
  });

  test("-v / --version prints only the version, not the full help", () => {
    // Regression: -v used to fall through to default → showHelp() dumped the whole usage.
    expect(content).toContain('case "-v":');
    expect(content).toContain('case "--version":');
    expect(content).toContain("🍵 matcha v${VERSION}");
  });

});
