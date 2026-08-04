import { describe, expect, test } from "vitest";
import { assertFile, readProjectFile, AGENT_NAMES } from "./helpers.js";

const PLATFORMS = [".claude", ".opencode", ".agents"];

describe("Agent files exist across platforms", () => {
  for (const platform of PLATFORMS) {
    describe(`${platform}/agents/`, () => {
      test.each(AGENT_NAMES)("%s.md exists", (agent) => {
        assertFile(`${platform}/agents/${agent}.md`);
      });
    });
  }
});

describe("Agent YAML frontmatter validation", () => {
  for (const agent of AGENT_NAMES) {
    describe(agent, () => {
      const content = readProjectFile(`.claude/agents/${agent}.md`);

      test("has YAML frontmatter", () => {
        expect(content.startsWith("---")).toBe(true);
      });

      test("has description", () => {
        expect(content).toMatch(/description: /);
      });

      test("has permission schema", () => {
        expect(content).toMatch(/permission:/);
        expect(content).toMatch(/read: allow/);
      });

      test("has no invalid model field", () => {
        expect(content).not.toMatch(/model: inherit/);
      });

      test("has no deprecated tools field", () => {
        expect(content).not.toMatch(/^tools:/m);
      });

      test("has name", () => {
        expect(content).toMatch(/name: /);
      });

      test("has no color field", () => {
        expect(content).not.toMatch(/color: /);
      });
    });
  }
});

describe("Agent content checks", () => {
  test("matcha-reviewer has review gate concept", () => {
    const content = readProjectFile(".claude/agents/matcha-reviewer.md");
    expect(content).toContain("review");
    expect(content).toContain("BLOCK");
  });

  test("matcha-reviewer has correctness check", () => {
    const content = readProjectFile(".claude/agents/matcha-reviewer.md");
    expect(content).toContain("Correctness");
  });
});
