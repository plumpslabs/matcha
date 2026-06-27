import { describe, expect, test } from "vitest";
import { readProjectFile, COMMAND_NAMES } from "./helpers.js";

describe("Commands — synced across platforms", () => {
  for (const cmd of COMMAND_NAMES) {
    describe(`/${cmd}`, () => {
      const canonical = readProjectFile(`commands/${cmd}.md`);

      test(`commands/${cmd}.md exists`, () => {
        expect(canonical.length).toBeGreaterThan(0);
      });

      test(`.claude/commands/${cmd}.md matches canonical`, () => {
        const copy = readProjectFile(`.claude/commands/${cmd}.md`);
        expect(copy).toBe(canonical);
      });

      test(`.agents/commands/${cmd}.md matches canonical`, () => {
        const copy = readProjectFile(`.agents/commands/${cmd}.md`);
        expect(copy).toBe(canonical);
      });
    });
  }
});
