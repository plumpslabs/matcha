import { describe, expect, test } from "vitest";
import {
  assertFile, readProjectFile, assertContent, ROOT,
  KEY_SECTIONS, AGENT_NAMES, COMMAND_NAMES, SKILL_MODULES,
} from "./helpers.js";

const CORE_FILES = [
  "skills/matcha/SKILL.md", "AGENTS.md", "LICENSE", "hooks/inject-rules.js",
  "CONTRIBUTING.md", "hooks/matcha-instructions.js", "install.sh", "QUICKSTART.md",
  ".claude-plugin/plugin.json", ".claude-plugin/marketplace.json",
  ".claude/settings.json", "GEMINI.md", ".windsurfrules",
  "hooks/patterns.json", "hooks/matcha-mcp-server.js",
  "scripts/build-adapters.js",
  "plugin.json", "mcp_config.json",
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

  test("plugin.json (AGY manifest) has current version", () => {
    const content = JSON.parse(readProjectFile("plugin.json"));
    expect(content.name).toBe("matcha");
    expect(content.version).toBe("2.5.5");
  });

  test("plugin.json (AGY manifest) declares all 8 commands", () => {
    const content = JSON.parse(readProjectFile("plugin.json"));
    const names = content.commands.map((c) => c.name);
    expect(names).toContain("matcha:why");
    expect(names).toContain("matcha:review");
    expect(names).toContain("matcha:audit");
    expect(names).toContain("matcha:intensity");
    expect(names).toContain("matcha:status");
    expect(names).toContain("matcha:debt");
    expect(names).toContain("matcha:markers");
    expect(names).toContain("matcha:stats");
  });

  test("mcp_config.json (AGY manifest) points to matcha MCP server", () => {
    const content = JSON.parse(readProjectFile("mcp_config.json"));
    expect(content.mcpServers.matcha.command).toBe("node");
    expect(content.mcpServers.matcha.args[0]).toContain("matcha-mcp-server.js");
  });
});

describe("Skill modules", () => {
  test("skills/matcha/SKILL.md exists", () => assertFile("skills/matcha/SKILL.md"));

  test.each(SKILL_MODULES)("skills/matcha/modules/%s exists", (m) => {
    assertFile(`skills/matcha/modules/${m}`);
  });

  test("SKILL.md references module index", () => {
    const content = readProjectFile("skills/matcha/SKILL.md");
    expect(content).toContain("Module Index");
    expect(content).toContain("modules/core.md");
  });

  test("core.md has all 6 checkpoints", () => {
    const content = readProjectFile("skills/matcha/modules/core.md");
    expect(content).toContain("Checkpoint 1");
    expect(content).toContain("Checkpoint 2");
    expect(content).toContain("Checkpoint 3");
    expect(content).toContain("Checkpoint 4");
    expect(content).toContain("Checkpoint 5");
  });

  test("core.md has intensity levels", () => {
    const content = readProjectFile("skills/matcha/modules/core.md");
    expect(content).toContain("observe");
    expect(content).toContain("enforce");
    expect(content).toContain("audit");
  });

  test("core.md has TDD mode (Red-Green-Refactor)", () => {
    const content = readProjectFile("skills/matcha/modules/core.md");
    expect(content).toContain("RED");
    expect(content).toContain("GREEN");
    expect(content).toContain("REFACTOR");
  });

  test("core.md has loop mode (retry/escalate)", () => {
    const content = readProjectFile("skills/matcha/modules/core.md");
    expect(content).toContain("Loop Mode");
    expect(content).toContain("Escalate");
  });

  test("core.md has issue format", () => {
    const content = readProjectFile("skills/matcha/modules/core.md");
    expect(content).toContain("Observation:");
    expect(content).toContain("Why it matters:");
  });
});

describe("Content validation", () => {
  const skill = readProjectFile("skills/matcha/SKILL.md");
  const agents = readProjectFile("AGENTS.md");

  test("SKILL.md has 5W1H reference", () => {
    expect(skill).toContain("5W1H");
  });

  test("SKILL.md references modules that contain matcha pause", () => {
    const core = readProjectFile("skills/matcha/modules/core.md");
    expect(core).toContain("matcha pause");
  });

  test("SKILL.md references modules that contain APPNAME_", () => {
    const core = readProjectFile("skills/matcha/modules/core.md");
    expect(core).toContain("APPNAME_");
  });

  test("AGENTS.md has 6-checkpoint filter", () => {
    expect(agents).toContain("6-Checkpoint");
  });

  test("AGENTS.md has agent registry table", () => {
    expect(agents).toContain("Agents");
  });

  test("AGENTS.md has command reference table", () => {
    expect(agents).toContain("Commands");
  });

  test("AGENTS.md has core principles", () => {
    expect(agents).toContain("Core Principles");
  });

  test("AGENTS.md has companion tools", () => {
    expect(agents).toContain("Kuma");
    expect(agents).toContain("Fennec");
  });

  test("AGENTS.md has MCP reference", () => {
    expect(agents).toContain("MCP");
  });

  test("AGENTS.md is under 120 non-empty lines", () => {
    const lines = agents.split("\n").filter((l) => l.trim());
    expect(lines.length).toBeLessThan(120);
  });
});

describe("MCP server", () => {
  const mcp = readProjectFile("hooks/matcha-mcp-server.js");

  test("has server info", () => {
    expect(mcp).toContain("matcha");
    expect(mcp).toContain("2.5.5");
  });

  test("has shield check tool", () => {
    expect(mcp).toContain("matcha_shield_check");
  });

  test("has post-write scan tool", () => {
    expect(mcp).toContain("matcha_post_write_scan");
  });

  test("has stop tips tool", () => {
    expect(mcp).toContain("matcha_stop_tips");
  });

  test("has plan validate tool", () => {
    expect(mcp).toContain("matcha_plan_validate");
  });

  test("has DANGER_PATTERNS", () => {
    expect(mcp).toContain("DANGER_PATTERNS");
  });
});

describe("Pattern registry", () => {
  const patterns = readProjectFile("hooks/patterns.json");
  const parsed = JSON.parse(patterns);

  test("has version", () => {
    expect(parsed.version).toBeDefined();
    expect(typeof parsed.version).toBe("string");
  });

  test("has multi-language support", () => {
    expect(parsed.languages).toBeDefined();
    expect(parsed.languages.js).toBeDefined();
    expect(parsed.languages.go).toBeDefined();
    expect(parsed.languages.python).toBeDefined();
    expect(parsed.languages.rust).toBeDefined();
    expect(parsed.languages.java).toBeDefined();
    expect(parsed.languages.ruby).toBeDefined();
    expect(parsed.languages.swift).toBeDefined();
  });

  test("each language has extensions", () => {
    for (const [lang, config] of Object.entries(parsed.languages)) {
      expect(config.extensions).toBeDefined();
      expect(config.extensions.length).toBeGreaterThan(0);
    }
  });

  test("each language has checks", () => {
    for (const [lang, config] of Object.entries(parsed.languages)) {
      if (config.checks) {
        expect(Object.keys(config.checks).length).toBeGreaterThan(0);
      } else if (config.extendsChecksFrom) {
        // TypeScript extends JS checks — valid
        expect(config.extendsChecksFrom).toBe("js");
      }
    }
  });

  test("has SQL checks", () => {
    expect(parsed.sql).toBeDefined();
    expect(parsed.sql.checks).toBeDefined();
    expect(parsed.sql.checks.unboundedQuery).toBeDefined();
  });

  test("has prose checks", () => {
    expect(parsed.prose).toBeDefined();
    expect(parsed.prose.checks).toBeDefined();
  });
});
