import { describe, expect, test } from "vitest";
import {
  assertFile, readProjectFile, assertContent, ROOT,
  KEY_SECTIONS, AGENT_NAMES, COMMAND_NAMES,
} from "./helpers.js";

const CORE_FILES = [
  "skills/matcha/SKILL.md", "AGENTS.md", "LICENSE", "hooks/inject-rules.js",
  "CONTRIBUTING.md", "hooks/matcha-instructions.js", "install.sh", "QUICKSTART.md",
  ".claude-plugin/plugin.json", ".claude-plugin/marketplace.json",
  ".claude/settings.json", "GEMINI.md", ".windsurfrules",
];

describe("Core files", () => {
  test.each(CORE_FILES)("%s exists", (f) => assertFile(f));

  test("GEMINI.md has matcha & Antigravity reference", () => {
    assertContent("GEMINI.md", "matcha", "Antigravity CLI");
  });

  test(".claude/settings.json has PreToolUse hook (matcha-shield)", () => {
    const content = readProjectFile(".claude/settings.json");
    expect(content).toContain("PreToolUse");
    expect(content).toContain("matcha-shield.js");
  });

  test(".claude/settings.json has PostToolUse hook (matcha-post-write)", () => {
    const content = readProjectFile(".claude/settings.json");
    expect(content).toContain("PostToolUse");
    expect(content).toContain("matcha-post-write.js");
  });

  test(".claude/settings.json has Stop hook (matcha-stop)", () => {
    const content = readProjectFile(".claude/settings.json");
    expect(content).toContain('"Stop"');
    expect(content).toContain("matcha-stop.js");
  });
});

describe("Content validation", () => {
  const skill = readProjectFile("skills/matcha/SKILL.md");
  const agents = readProjectFile("AGENTS.md");

  test.each(KEY_SECTIONS)('SKILL.md contains "%s"', (s) => {
    expect(skill).toContain(s);
  });

  test.each(KEY_SECTIONS)('AGENTS.md contains "%s"', (s) => {
    expect(agents).toContain(s);
  });

  test("SKILL.md has Observation pattern", () => {
    expect(skill).toContain("Observation:");
  });

  test("SKILL.md has End-of-Task Suggestions", () => {
    expect(skill).toContain("End-of-Task Suggestions");
  });

  test("SKILL.md has Feedback Harness section", () => {
    expect(skill).toContain("Feedback Harness");
  });

  test("SKILL.md has Verify checkpoint", () => {
    expect(skill).toContain("Checkpoint 5: Verify");
  });

  test("SKILL.md has TDD Mode section", () => {
    expect(skill).toContain("Test-Driven Development");
  });
});

describe("AGENTS.md vs CLAUDE.md separation", () => {
  const agentsMd = readProjectFile("AGENTS.md");
  const claudeMd = readProjectFile("CLAUDE.md");

  test("CLAUDE.md has Claude persona header", () => {
    expect(claudeMd).toContain("Claude Persona");
  });

  test("AGENTS.md has agent registry table", () => {
    expect(agentsMd).toContain("Agents");
  });

  test("AGENTS.md has command reference table", () => {
    expect(agentsMd).toContain("Commands");
  });

  test("CLAUDE.md is shorter than AGENTS.md", () => {
    expect(claudeMd.length).toBeLessThan(agentsMd.length);
  });

  test("AGENTS.md is under 50 non-empty lines", () => {
    const lines = agentsMd.split("\n").filter((l) => l.trim());
    expect(lines.length).toBeLessThan(50);
  });
});

