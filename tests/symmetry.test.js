import { lstatSync, readlinkSync, readFileSync, existsSync } from "fs";
import { describe, expect, test } from "vitest";
import { ROOT, AGENT_NAMES } from "./helpers.js";
import { join } from "path";

describe("Symmetry — agent files", () => {
  const canonicalDir = ".agents/agents";

  for (const agent of AGENT_NAMES) {
    const file = `${agent}.md`;

    test(`${agent}: .opencode/agents/${file} exists`, () => {
      expect(existsSync(join(ROOT, ".opencode/agents", file))).toBe(true);
    });

    test(`${agent}: .opencode/agents/${file} is symlink to canonical`, () => {
      const stat = lstatSync(join(ROOT, ".opencode/agents", file));
      expect(stat.isSymbolicLink()).toBe(true);
      expect(readlinkSync(join(ROOT, ".opencode/agents", file))).toBe(`../../.agents/agents/${file}`);
    });

    test(`${agent}: .claude/agents/${file} is symlink to canonical`, () => {
      const stat = lstatSync(join(ROOT, ".claude/agents", file));
      expect(stat.isSymbolicLink()).toBe(true);
      expect(readlinkSync(join(ROOT, ".claude/agents", file))).toBe(`../../.agents/agents/${file}`);
    });
  }
});

describe("Symmetry — canonical source", () => {
  test(".agents/agents/ has no references to non-canonical paths", () => {
    const files = AGENT_NAMES.map(a => join(ROOT, ".agents/agents", `${a}.md`));
    for (const f of files) {
      const content = readFileSync(f, "utf-8");
      // Should not reference .opencode or .claude paths
      expect(content).not.toContain(".opencode/");
      expect(content).not.toContain(".claude/");
    }
  });
});

describe("Symmetry — no stale duplicates", () => {
  const platformDirs = [".opencode/agents", ".claude/agents"];

  for (const dir of platformDirs) {
    test(`${dir} has no non-symlink agent files`, () => {
      for (const agent of AGENT_NAMES) {
        const path = join(ROOT, dir, `${agent}.md`);
        if (existsSync(path)) {
          const stat = lstatSync(path);
          if (!stat.isSymbolicLink()) {
            // Regular file in platform dir = stale copy, should be symlink
            expect(false).toBe(true);
          }
        }
      }
    });
  }
});

describe("Symmetry — SKILL.md canonical", () => {
  const canonical = "skills/matcha/SKILL.md";
  const copies = [
    ".opencode/skills/matcha/SKILL.md",
    ".claude/skills/matcha/SKILL.md",
    ".openclaw/skills/matcha/SKILL.md",
  ];

  test("canonical SKILL.md exists", () => {
    expect(existsSync(join(ROOT, canonical))).toBe(true);
  });

  for (const copy of copies) {
    test(`${copy} is symlink to canonical`, () => {
      const path = join(ROOT, copy);
      expect(existsSync(path)).toBe(true);
      const stat = lstatSync(path);
      expect(stat.isSymbolicLink()).toBe(true);
    });
  }
});
