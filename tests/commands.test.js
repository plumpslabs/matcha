import { lstatSync, readlinkSync } from "fs";
import { describe, expect, test } from "vitest";
import { readProjectFile, COMMAND_NAMES, ROOT } from "./helpers.js";
import { join } from "path";

describe("Commands — synced across platforms", () => {
  for (const cmd of COMMAND_NAMES) {
    describe(`/${cmd}`, () => {
      const canonical = readProjectFile(`commands/${cmd}.md`);

      test(`commands/${cmd}.md exists`, () => {
        expect(canonical.length).toBeGreaterThan(0);
      });

      test(`.claude/commands/${cmd}.md validates as Claude Code command`, () => {
        const path = join(ROOT, `.claude/commands/${cmd}.md`);
        const stat = lstatSync(path);
        expect(stat.isSymbolicLink()).toBe(true);
        const target = readlinkSync(path);
        expect(target).toMatch(/^# \/matcha[: ]/);
        expect(target).toContain(cmd);
      });

      test(`.agents/commands/${cmd}.md matches canonical`, () => {
        const copy = readProjectFile(`.agents/commands/${cmd}.md`);
        expect(copy).toBe(canonical);
      });
    });
  }
});
