import { lstatSync, readlinkSync, readFileSync } from "fs";
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
        // Can be symlink (legacy) or regular file (new)
        if (stat.isSymbolicLink()) {
          const target = readlinkSync(path);
          expect(target).toMatch(/^# \/matcha[: ]/);
          expect(target).toContain(cmd);
        } else {
          const content = readFileSync(path, "utf-8");
          // Optional YAML frontmatter (description) — strip it before validating body
          const body = content.replace(/^---\n[\s\S]*?\n---\n/, "");
          expect(body).toMatch(/^# \/matcha[: ]/);
          expect(content).toContain(cmd);
        }
      });

      test(`commands/${cmd}.md has description frontmatter`, () => {
        expect(canonical).toMatch(/^---\n/);
        expect(canonical).toMatch(/description: .+/);
      });

      test(`.agents/commands/${cmd}.md matches canonical`, () => {
        const copy = readProjectFile(`.agents/commands/${cmd}.md`);
        expect(copy).toBe(canonical);
      });
    });
  }
});
