import { lstatSync, readlinkSync, readFileSync, existsSync } from "fs";
import { describe, expect, test } from "vitest";
import { ROOT, AGENT_NAMES, COMMAND_NAMES, readProjectFile } from "./helpers.js";
import { join } from "path";
import { truncateCommand } from "../scripts/command-truncate.js";

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

    test(`${agent}: .claude/agents/${file} is a Claude Code-format real file`, () => {
      const path = join(ROOT, ".claude/agents", file);
      expect(existsSync(path)).toBe(true);
      const stat = lstatSync(path);
      expect(stat.isSymbolicLink()).toBe(false);
      const content = readFileSync(path, "utf-8");
      // Claude Code native frontmatter: tools: allowlist + disallowedTools: — NOT OpenCode mode:/permission:
      expect(content).toMatch(/^tools: /m);
      expect(content).toMatch(/^disallowedTools: /m);
      expect(content).not.toMatch(/^mode: /m);
      expect(content).not.toMatch(/^permission:/m);
      expect(content).not.toMatch(/^mainAgent:/m);
    });
  }
});

describe("Symmetry — canonical source", () => {
  test(".agents/agents/ has no references to non-canonical paths", () => {
    const files = AGENT_NAMES.map(a => join(ROOT, ".agents/agents", `${a}.md`));
    for (const f of files) {
      const content = readFileSync(f, "utf-8");
      expect(content).not.toContain(".opencode/");
      expect(content).not.toContain(".claude/");
    }
  });
});

describe("Symmetry — AGY plugin root agents/", () => {
  for (const agent of AGENT_NAMES) {
    const file = `${agent}.md`;

    test(`agents/${file} exists (AGY plugin subagent)`, () => {
      expect(existsSync(join(ROOT, "agents", file))).toBe(true);
    });

    test(`agents/${file} matches canonical .agents/agents/${file}`, () => {
      const canonical = readFileSync(join(ROOT, ".agents/agents", file), "utf-8");
      const rootCopy = readFileSync(join(ROOT, "agents", file), "utf-8");
      expect(rootCopy).toBe(canonical);
    });
  }

  test("mcp_config.json (AGY plugin) is valid JSON with matcha server", () => {
    const content = JSON.parse(readFileSync(join(ROOT, "mcp_config.json"), "utf-8"));
    expect(content.mcpServers.matcha).toBeDefined();
  });
});

describe("Symmetry — no stale duplicates", () => {
  const platformDirs = [".opencode/agents", ".claude/agents"];

  for (const dir of [".opencode/agents"]) {
    test(`${dir} has no non-symlink agent files`, () => {
      for (const agent of AGENT_NAMES) {
        const path = join(ROOT, dir, `${agent}.md`);
        if (existsSync(path)) {
          const stat = lstatSync(path);
          if (!stat.isSymbolicLink()) {
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
    ".agents/skills/matcha/SKILL.md",
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

describe("Symmetry — Skill modules exist", () => {
  const modules = ["core.md", "project.md", "modes.md", "risk.md", "engineering.md", "legacy.md"];
  const platformDirs = [
    ".agents/skills/matcha/modules",
    ".claude/skills/matcha/modules",
    ".opencode/skills/matcha/modules",
    ".openclaw/skills/matcha/modules",
  ];

  for (const mod of modules) {
    test(`skills/matcha/modules/${mod} exists (canonical)`, () => {
      expect(existsSync(join(ROOT, "skills/matcha/modules", mod))).toBe(true);
    });
  }

  for (const dir of platformDirs) {
    test(`${dir} resolves all ${modules.length} modules`, () => {
      for (const mod of modules) {
        expect(existsSync(join(ROOT, dir, mod))).toBe(true);
      }
    });
  }
});

describe("Symmetry — Pattern registry", () => {
  test("hooks/patterns.json exists and is valid JSON", () => {
    const content = readFileSync(join(ROOT, "hooks/patterns.json"), "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.version).toBeDefined();
    expect(Object.keys(parsed.languages).length).toBeGreaterThanOrEqual(7);
  });
});

describe("Semantic consistency — command ↔ agent alignment", () => {
  test("/matcha:audit report format matches @matcha-auditor output schema", () => {
    const cmd = readProjectFile("commands/matcha:audit.md");
    const agent = readProjectFile(".agents/agents/matcha-auditor.md");
    // Sections the command must carry so results consolidate into the same monthly ledger.
    for (const section of ["Executive Summary", "Overall Health", "Positive Observations", "Quick Wins", "Technical Debt", "Recommendations"]) {
      expect(cmd).toContain(section);
      expect(agent).toContain(section);
    }
  });

  test("/matcha:audit and /matcha:why declare a persistence contract", () => {
    const audit = readProjectFile("commands/matcha:audit.md");
    const why = readProjectFile("commands/matcha:why.md");
    expect(audit).toContain(".agents/reports/auditor-");
    expect(why).toContain(".agents/plan/current.md");
  });

  test("stop-condition vocabulary is uniform: STOP everywhere, HALT nowhere", () => {
    // No divergent term (HALT) in any agent.
    for (const agent of AGENT_NAMES) {
      expect(readProjectFile(`.agents/agents/${agent}.md`)).not.toContain("HALT");
    }
    // Agents with a cannot-proceed condition use the standard STOP term.
    // (reviewer expresses it as the EXPERT_REQUIRED verdict; cleaner has no stop condition.)
    for (const agent of ["matcha-planner", "matcha-finder", "matcha-auditor", "matcha-debugger"]) {
      expect(readProjectFile(`.agents/agents/${agent}.md`)).toMatch(/STOP/);
    }
  });

  test("engineering.md covers the universal engineering bar (errors, logging, validation, API, state, concurrency, security, testing, resilience)", () => {
    const eng = readProjectFile("skills/matcha/modules/engineering.md");
    for (const section of ["## Errors", "## Logging", "## Validation", "## API Contracts", "## State", "## Concurrency", "## Security", "## Testing", "## Resilience & Data"]) {
      expect(eng).toContain(section);
    }
  });

  test("review gate is consistently 9 categories across reviewer, core, risk", () => {
    const reviewer = readProjectFile(".agents/agents/matcha-reviewer.md");
    const core = readProjectFile("skills/matcha/modules/core.md");
    const risk = readProjectFile("skills/matcha/modules/risk.md");
    expect(reviewer).toContain("Full 9-category");
    expect(reviewer).toContain("Resilience & Data");
    expect(core).toContain("9-category review");
    expect(core).not.toContain("8-category");
    expect(risk).toContain("Full Review (9 categories)");
    expect(risk).not.toContain("8 categories");
  });

  test("Proportionality principle is wired through the layers (anti-over-analysis)", () => {
    const core = readProjectFile("skills/matcha/modules/core.md");
    const skill = readProjectFile("skills/matcha/SKILL.md");
    const agents = readProjectFile("AGENTS.md");
    const planner = readProjectFile(".agents/agents/matcha-planner.md");
    const risk = readProjectFile("skills/matcha/modules/risk.md");
    const gemini = readProjectFile("GEMINI.md");
    const windsurf = readProjectFile(".windsurfrules");
    const rules = readProjectFile(".agents/rules/matcha.md");
    // Principle defined once in core.md and surfaced in the always-loaded layers.
    expect(core).toContain("## ⚖️ Proportionality");
    expect(core).toMatch(/Exit conditions beat STOP/i);
    expect(skill).toContain("Proportionality");
    expect(agents).toContain("Proportionality");
    // Planner must not block on trivia: STOP carries a trivial-task exit.
    expect(planner).toContain("unless trivial");
    // Review gate must not over-review trivials.
    expect(risk).toContain("trivial change");
    expect(risk).toContain("auto-routes");
    // Manually-synced platform files + AGY rules must carry the principle too
    // (they're not generated by build-adapters — this guards against silent drift).
    expect(gemini).toContain("Proportionality");
    expect(windsurf).toContain("Proportionality");
    expect(rules).toContain("Proportionality");
  });

  test("modes.md does not duplicate the gate matrix (single source in core.md)", () => {
    const modes = readProjectFile("skills/matcha/modules/modes.md");
    const core = readProjectFile("skills/matcha/modules/core.md");
    // The mode × gate matrix lives once in core.md; modes.md must point to it, not re-table it.
    expect(modes).toContain("single source of truth");
    expect(modes).not.toContain("### With Planning Gate");
    expect(modes).not.toContain("### With Review Gate");
    expect(core).toContain("Context-Aware Modes");
  });

  test(".claude/commands truncated copies match the build-adapters regeneration rule", () => {
    for (const cmd of COMMAND_NAMES) {
      const canonical = readProjectFile(`commands/${cmd}.md`).trim();
      const expected = truncateCommand(canonical, cmd);
      expect(readProjectFile(`.claude/commands/${cmd}.md`).trim()).toBe(expected);
    }
  });
});

describe("Symmetry — MCP server", () => {
  test("hooks/matcha-mcp-server.js exists", () => {
    expect(existsSync(join(ROOT, "hooks/matcha-mcp-server.js"))).toBe(true);
  });

  test("hooks/matcha-mcp-server.js has MCP tools", () => {
    const content = readFileSync(join(ROOT, "hooks/matcha-mcp-server.js"), "utf-8");
    expect(content).toContain("matcha_shield_check");
    expect(content).toContain("matcha_post_write_scan");
    expect(content).toContain("matcha_stop_tips");
    expect(content).toContain("matcha_plan_validate");
  });
});
