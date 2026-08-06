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
        test("planner/finder: lean read-only bash whitelist (git + rg + find, deny fallback)", () => {
          expect(content).not.toMatch(/^  bash: (allow|deny)$/m);
          // order-sensitive: catch-all first, then git read-only (opencode: last matching rule wins)
          expect(content).toContain('bash:\n    "*": deny\n    "git log*": allow');
          expect(content).toContain('"head*": allow');
        });

        test("planner/finder: no file-reading bash (sed/cat/awk/grep -r/sort/uniq/echo removed — use read tool)", () => {
          expect(content).not.toContain('"sed -n*": allow');
          expect(content).not.toContain('"echo *": allow');
          expect(content).not.toContain('"cat *package.json": allow');
          expect(content).not.toContain('"awk*": allow');
          expect(content).not.toContain('"grep -r*": allow');
          expect(content).not.toContain('"sort*": allow');
          expect(content).not.toContain('"uniq*": allow');
        });

        test("planner/finder: guidance directs file reads to the read tool", () => {
          expect(content).toContain("`read` tool");
          expect(content).toContain("never via bash");
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

        test("auditor: build variants NOT allowlisted (write dist/, falls to *: ask)", () => {
          expect(content).not.toContain('"npm run build*": allow');
          expect(content).not.toContain('"pnpm run build*": allow');
          expect(content).not.toContain('"yarn run build*": allow');
          expect(content).not.toContain('"bun run build*": allow');
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

describe("Whitelist consistency (Never Twice)", () => {
  test("planner and finder bash whitelists are identical (no drift)", () => {
    const planner = readProjectFile(".claude/agents/matcha-planner.md");
    const finder = readProjectFile(".claude/agents/matcha-finder.md");
    const extract = (c) => {
      const m = c.match(/  bash:\n([\s\S]*?)\n  webfetch/);
      return m ? m[1].replace(/\s+/g, " ") : "";
    };
    expect(extract(planner)).toBe(extract(finder));
  });
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
