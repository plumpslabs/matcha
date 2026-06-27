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

      test("has tools as YAML array", () => {
        expect(content).toContain("  - ");
        expect(content).toMatch(/tools:/);
      });

      test("has model: inherit", () => {
        expect(content).toMatch(/model: inherit/);
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
  test("matcha-reviewer has Verify step", () => {
    const content = readProjectFile(".claude/agents/matcha-reviewer.md");
    expect(content).toContain("Verify");
  });

  test("matcha-reviewer has Feedback Harness rule", () => {
    const content = readProjectFile(".claude/agents/matcha-reviewer.md");
    expect(content).toContain("Feedback Harness");
  });
});
