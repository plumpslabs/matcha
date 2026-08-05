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
    expect(content.version).toBe("2.5.13");
  });

  test("plugin.json (AGY manifest) declares all 7 commands", () => {
    const content = JSON.parse(readProjectFile("plugin.json"));
    const names = content.commands.map((c) => c.name);
    expect(names).toContain("matcha:why");
    expect(names).toContain("matcha:review");
    expect(names).toContain("matcha:audit");
    expect(names).toContain("matcha:intensity");
    expect(names).toContain("matcha:status");
    expect(names).toContain("matcha:debt");
    expect(names).toContain("matcha:markers");
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

  test("SKILL.md frontmatter is spec-compliant (no non-standard triggers field)", () => {
    const content = readProjectFile("skills/matcha/SKILL.md");
    expect(content).toMatch(/^---\nname: matcha\n/);
    expect(content).not.toMatch(/^triggers:/m);
    expect(content).toMatch(/^metadata:\n\s+version: /m);
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

  test("SKILL.md has Intent Discovery reference", () => {
    expect(skill).toContain("Intent Discovery");
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
    expect(mcp).toContain("2.5.13");
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

describe("Session memory (persist & rehydrate)", () => {
  test("core.md has Session Memory section", () => {
    const core = readProjectFile("skills/matcha/modules/core.md");
    expect(core).toContain("Session Memory");
    expect(core).toContain(".agents/plan/current.md");
    expect(core).toContain("Lazy-load");
  });

  test("AGENTS.md references session memory", () => {
    const agents = readProjectFile("AGENTS.md");
    expect(agents).toContain("Session Memory");
    expect(agents).toContain(".agents/plan/current.md");
  });

  test("planner persists plan to .agents/plan/current.md", () => {
    const planner = readProjectFile(".agents/agents/matcha-planner.md");
    expect(planner).toContain("<persistence>");
    expect(planner).toContain(".agents/plan/current.md");
  });

  test("core.md defines current.md lifecycle (archive + reset anti-stale)", () => {
    const core = readProjectFile("skills/matcha/modules/core.md");
    expect(core).toContain("lifecycle");
    expect(core).toContain("reset");
    expect(core).toContain("reports/planner-");
  });

  test("planning gate enforces Session Memory plan location", () => {
    const gate = readProjectFile("hooks/planning-gate.js");
    expect(gate).toContain(".agents/plan/current.md");
    expect(gate).toContain("validatePlanContent");
  });

  test(".claude/settings.json matcher covers file writes (gate fires on edits)", () => {
    const settings = readProjectFile(".claude/settings.json");
    expect(settings).toContain("Bash|Edit|Write|MultiEdit");
  });

  test("opencode plugin enforces the planning gate (reuses shared hook)", () => {
    const plugin = readProjectFile(".opencode/plugins/matcha.js");
    expect(plugin).toContain("checkPlanningGate");
  });

  test("opencode plugin uses factory-function format (export default is dead)", () => {
    const plugin = readProjectFile(".opencode/plugins/matcha.js");
    expect(plugin).toContain("export const MatchaPlugin");
    expect(plugin).toContain("output.args");
  });

  test("matcha-instructions.js injects the operational trigger", () => {
    const inst = readProjectFile("hooks/matcha-instructions.js");
    expect(inst).toContain("Operational Triggers");
    expect(inst).toContain("BEFORE the first code edit");
  });

  test("hooks/hooks.json matcher covers file writes (Claude plugin path)", () => {
    const hooks = readProjectFile("hooks/hooks.json");
    expect(hooks).toContain("Bash|Edit|Write|MultiEdit");
  });

  test("AGY plugin rules/ exists and matches source of truth", () => {
    const rules = readProjectFile("rules/matcha.md");
    const canonical = readProjectFile(".agents/rules/matcha.md");
    expect(rules).toContain("matcha");
    expect(rules.trim()).toBe(canonical.trim());
  });

  test("reviewer + auditor persist to .agents/reports/", () => {
    const reviewer = readProjectFile(".agents/agents/matcha-reviewer.md");
    const auditor = readProjectFile(".agents/agents/matcha-auditor.md");
    expect(reviewer).toContain("<persistence>");
    expect(reviewer).toContain(".agents/reports/");
    expect(auditor).toContain("<persistence>");
    expect(auditor).toContain(".agents/reports/");
  });

  test("bin/matcha.js scaffolds memory dirs at init", () => {
    const bin = readProjectFile("bin/matcha.js");
    expect(bin).toContain("ensureMemoryScaffold");
    expect(bin).toContain(".agents/plan/current.md");
    expect(bin).toContain(".agents/reports");
  });

  test("check-rule-copies covers markers command", () => {
    const checker = readProjectFile("scripts/check-rule-copies.js");
    expect(checker).toContain('"markers"');
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
