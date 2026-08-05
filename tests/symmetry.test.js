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

  for (const dir of platformDirs) {
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
  const modules = ["core.md", "project.md", "modes.md", "risk.md", "legacy.md"];
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
    test(`${dir} resolves all 5 modules`, () => {
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
