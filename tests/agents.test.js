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

describe("Command YAML frontmatter validation", () => {
  const commandFiles = ["matcha:why", "matcha:review", "matcha:audit", "matcha:intensity", "matcha:status", "matcha:debt", "matcha:markers"];

  for (const cmd of commandFiles) {
    test(`commands/${cmd}.md has description frontmatter`, () => {
      const content = readProjectFile(`commands/${cmd}.md`);
      expect(content).toMatch(/^---\n/);
      expect(content).toMatch(/description: .+/);
    });
  }
});

const READ_ONLY_AGENTS = ["matcha-planner", "matcha-finder", "matcha-reviewer", "matcha-auditor"];
const WRITER_AGENTS = ["matcha-debugger", "matcha-cleaner"];
const PRIMARY_AGENTS = ["matcha-planner", "matcha-finder", "matcha-reviewer", "matcha-auditor"];
const SUBAGENT_AGENTS = ["matcha-debugger", "matcha-cleaner"];

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

      if (PRIMARY_AGENTS.includes(agent)) {
        test("primary agent (Tab-switchable)", () => {
          expect(content).toMatch(/mode: primary/);
        });
      }

      if (SUBAGENT_AGENTS.includes(agent)) {
        test("subagent (via @ mention)", () => {
          expect(content).toMatch(/mode: subagent/);
        });
      }

      if (READ_ONLY_AGENTS.includes(agent)) {
        test("read-only: denies source edits + Claude disallowedTools", () => {
          expect(content).not.toMatch(/^  edit: allow$/m);
          expect(content).toMatch(/disallowedTools: Write, Edit/);
          expect(content).toMatch(/task: deny/);
          expect(content).toMatch(/webfetch: deny/);
        });
      } else if (WRITER_AGENTS.includes(agent)) {
        test("writer: allows edits", () => {
          expect(content).toMatch(/^  edit: allow$/m);
        });

        test("writer: AGY subagent-only (mainAgent: false)", () => {
          expect(content).toMatch(/mainAgent: false/);
          expect(content).toMatch(/subagent: true/);
        });
      }

      if (agent === "matcha-planner") {
        test("planner may persist plan file only", () => {
          expect(content).toMatch(/\.agents\/plan\/current\.md": allow/);
          expect(content).toMatch(/\.agents\/reports\/\*\*": allow/);
        });
      }

      if (["matcha-reviewer", "matcha-auditor"].includes(agent)) {
        test("reviewer/auditor may persist reports", () => {
          expect(content).toMatch(/\.agents\/reports\/\*\*": allow/);
        });
      }

      if (agent === "matcha-reviewer") {
        test("reviewer keeps full bash (L0/L1 gate must run builds/tests)", () => {
          expect(content).toMatch(/^  bash: allow$/m);
        });
      }

      if (agent === "matcha-reviewer") {
        test("reviewer may reset current.md on PASS (lifecycle handoff)", () => {
          expect(content).toMatch(/\.agents\/plan\/current\.md": allow/);
          expect(content).toContain("reset");
        });
      }

      if (["matcha-planner", "matcha-finder"].includes(agent)) {
        test("planner/finder: read-only bash whitelist (git + manifests, deny fallback)", () => {
          expect(content).not.toMatch(/^  bash: (allow|deny)$/m);
          // order-sensitive: catch-all first, then git read-only (opencode: last matching rule wins)
          expect(content).toContain('bash:\n    "*": deny\n    "git log*": allow');
          expect(content).toContain('"head*": allow');
        });
      }

      if (agent === "matcha-auditor") {
        test("auditor: bash read-only whitelist with ask fallback", () => {
          expect(content).not.toMatch(/^  bash: allow$/m);
          expect(content).toContain('bash:\n    "*": ask\n    "git log*": allow');
          expect(content).toContain('"npm run test*": allow');
          expect(content).toContain('"npx jest*": allow');
          expect(content).toContain('"head*": allow');
        });
      }

      if (["matcha-debugger", "matcha-cleaner"].includes(agent)) {
        test("writer allows bash", () => {
          expect(content).toMatch(/bash: allow/);
        });
      }
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
