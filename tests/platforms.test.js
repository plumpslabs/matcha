import { describe, test } from "vitest";
import { assertFile, PLATFORM_RULES } from "./helpers.js";

describe("Platform rule files exist", () => {
  for (const [dir, files] of Object.entries(PLATFORM_RULES)) {
    describe(dir, () => {
      test.each(files)("%s", (f) => assertFile(`${dir}/${f}`));
    });
  }

  // Single-file platforms
  const singles = [
    ".clinerules/matcha.md",
    ".windsurf/rules/matcha.md",
    ".openclaw/skills/matcha/SKILL.md",
  ];

  test.each(singles)("%s exists", (f) => assertFile(f));
});
