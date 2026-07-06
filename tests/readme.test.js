import { describe, expect, test } from "vitest";
import { readProjectFile } from "./helpers.js";

describe("README", () => {
  const readme = readProjectFile("README.md");

  test("has CLI node bin/matcha.js reference", () => {
    expect(readme).toContain("node bin/matcha.js");
  });

  test("has platform rows", () => {
    const rows = readme.match(/\| \*\*/g);
    expect(rows?.length).toBeGreaterThanOrEqual(6);
  });
});
