import { describe, expect, test } from "vitest";
import { readProjectFile } from "./helpers.js";

describe("README", () => {
  const readme = readProjectFile("README.md");

  test("has Qoder row", () => {
    expect(readme).toContain("Qoder");
  });

  test("has Qwen row", () => {
    expect(readme).toContain("Qwen Code");
  });

  test("has CLI node bin/matcha.js reference", () => {
    expect(readme).toContain("node bin/matcha.js");
  });

  test("has 10+ platform rows", () => {
    const rows = readme.match(/\| \*\*/g);
    expect(rows?.length).toBeGreaterThanOrEqual(10);
  });
});
