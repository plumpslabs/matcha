import { describe, test } from "vitest";
import { assertFile } from "./helpers.js";

describe("Platform rule files exist", () => {
  const kiroCore = ["matcha.md", "dev-mode.md", "review-mode.md"];
  for (const f of kiroCore) {
    test(`.kiro/steering/${f} exists`, () => assertFile(`.kiro/steering/${f}`));
  }

  test(".openclaw/skills/matcha/SKILL.md exists", () => assertFile(".openclaw/skills/matcha/SKILL.md"));
});
