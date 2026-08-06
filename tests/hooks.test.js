import { describe, expect, test } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertFile, assertValidSyntax, readProjectFile, ROOT } from "./helpers.js";

const HOOKS = [
  "hooks/matcha-shield.js",
  "hooks/matcha-post-write.js",
  "hooks/matcha-stop.js",
  "hooks/matcha-mcp-server.js",
  "hooks/matcha-agy-hooks.js",
  "hooks/workspace-root.js",
];

describe("Hook syntax", () => {
  test.each(HOOKS)("%s exists", (f) => assertFile(f));
  test.each(HOOKS)(`%s valid Node syntax`, (f) => assertValidSyntax(f));
});

describe("workspace-root.js (monorepo root resolution)", () => {
  // Regression: hooks must resolve .agents/ at the workspace root, not cwd,
  // so launching from a sub-project of a monorepo can't lose the plan/state.
  const ROOT_HOOKS = [
    "hooks/planning-gate.js",
    "hooks/mode-detect.js",
    "hooks/matcha-metrics.js",
    "hooks/matcha-stop.js",
    "hooks/matcha-instructions.js",
    "hooks/matcha-mcp-server.js",
    "bin/matcha.js",
  ];

  // shield delegates to planning-gate/mode-detect/metrics (which all use the
  // helper) — it holds no .agents path itself.
  test("matcha-shield.js delegates root resolution (no bare process.cwd())", () => {
    const content = readProjectFile("hooks/matcha-shield.js");
    expect(content).not.toMatch(/process\.cwd\(\)/);
  });

  for (const f of ROOT_HOOKS) {
    test(`${f} uses getWorkspaceRoot() instead of bare process.cwd()`, () => {
      const content = readProjectFile(f);
      expect(content).toContain("getWorkspaceRoot");
    });
  }

  test("hooks import the shared helper (not inline duplicates)", () => {
    const gate = readProjectFile("hooks/planning-gate.js");
    expect(gate).toContain("from \"./workspace-root.js\"");
  });
});

test("matcha-shield.js has danger patterns", () => {
  const content = readProjectFile("hooks/matcha-shield.js");
  expect(content).toContain("DANGER_PATTERNS");
});

describe("matcha-post-write.js", () => {
  const content = readProjectFile("hooks/matcha-post-write.js");

  test("uses patterns.json registry", () => {
    expect(content).toContain("patterns.json");
  });

  test("has loadPatterns function", () => {
    expect(content).toContain("loadPatterns");
  });

  test("has detectLanguage function", () => {
    expect(content).toContain("detectLanguage");
  });

  test("has scanFile function", () => {
    expect(content).toContain("scanFile");
  });

  test("supports multi-language detection via patterns.json", () => {
    expect(content).toContain("detectLanguage");
    expect(content).toContain("loadPatterns");
  });

  test("scans matcha marker format/language compliance (English-only)", () => {
    expect(content).toContain("patterns.markers");
    expect(content).toContain("nonEnglishScript");
    expect(content).toContain("indonesianWords");
    expect(content).toContain("emptyOrPlaceholder");
  });

  test("has postToolUse export", () => {
    expect(content).toContain("postToolUse");
  });

  test("has CLI mode", () => {
    expect(content).toContain("isDirectInvocation");
  });
});

describe("matcha-mcp-server.js", () => {
  const content = readProjectFile("hooks/matcha-mcp-server.js");

  test("has MCP protocol handling", () => {
    expect(content).toContain("jsonrpc");
    expect(content).toContain("tools/list");
    expect(content).toContain("tools/call");
  });

  test("has 4 tools defined", () => {
    expect(content).toContain("matcha_shield_check");
    expect(content).toContain("matcha_post_write_scan");
    expect(content).toContain("matcha_stop_tips");
    expect(content).toContain("matcha_plan_validate");
  });

  test("has DANGER_PATTERNS", () => {
    expect(content).toContain("DANGER_PATTERNS");
  });

  test("has plan validation", () => {
    expect(content).toContain("validatePlan");
    expect(content).toContain("matcha_gate");
  });
});

test("matcha-stop.js has relevant patterns", () => {
  const content = readProjectFile("hooks/matcha-stop.js");
  expect(content).toContain("matcha");
});

describe("matcha marker enforcement (English-only, standard format)", () => {
  const patterns = JSON.parse(readProjectFile("hooks/patterns.json"));

  test("patterns.json defines markers checks", () => {
    expect(patterns.markers).toBeDefined();
    expect(patterns.markers.checks.nonEnglishScript).toBeDefined();
    expect(patterns.markers.checks.indonesianWords).toBeDefined();
    expect(patterns.markers.checks.emptyOrPlaceholder).toBeDefined();
  });

  test("non-English marker regex matches Indonesian words", () => {
    const re = new RegExp(patterns.markers.checks.indonesianWords.patterns[0], "i");
    expect(re.test("// matcha: buat sementara dulu")).toBe(true);
    expect(re.test("// matcha:explain untuk sementara pakai cache")).toBe(true);
    // English markers must NOT match
    expect(re.test("// matcha:explain temporary cache workaround")).toBe(false);
  });

  test("non-Latin script regex matches CJK/Arabic", () => {
    const re = new RegExp(patterns.markers.checks.nonEnglishScript.patterns[0], "i");
    expect(re.test("// matcha: 暂时用缓存")).toBe(true);
    expect(re.test("// matcha:explain temporary cache workaround")).toBe(false);
  });

  test("indonesianWords excludes ambiguous 'di'/'ini' (DI container, INI config are valid English)", () => {
    const re = new RegExp(patterns.markers.checks.indonesianWords.patterns[0], "i");
    expect(re.test("// matcha:explain using DI container")).toBe(false);
    expect(re.test("// matcha:todo parse ini config")).toBe(false);
    // still catches real Indonesian
    expect(re.test("// matcha: buat sementara dulu")).toBe(true);
  });

  test("emptyOrPlaceholder does not flag short valid English markers (escaped dots)", () => {
    const re = new RegExp(patterns.markers.checks.emptyOrPlaceholder.patterns[0], "i");
    // empty / placeholder → flagged
    expect(re.test("// matcha:")).toBe(true);
    expect(re.test("// matcha:explain")).toBe(true);
    expect(re.test("// matcha:explain TBD")).toBe(true);
    // valid short reason → NOT flagged (regression: unescaped '...' matched any 3 chars)
    expect(re.test("// matcha:explain fix")).toBe(false);
    expect(re.test("// matcha:explain temporary cache workaround")).toBe(false);
  });

  test("reviewer agent enforces English-only markers (WARNING)", () => {
    const reviewer = readProjectFile(".agents/agents/matcha-reviewer.md");
    expect(reviewer).toContain("English only");
    expect(reviewer).toContain("WARNING");
    expect(reviewer).toContain("buat sementara");
  });

  test("core.md + AGENTS.md + markers command document English-only rule", () => {
    const core = readProjectFile("skills/matcha/modules/core.md");
    const agentsMd = readProjectFile("AGENTS.md");
    const markersCmd = readProjectFile("commands/matcha:markers.md");
    expect(core).toContain("English only");
    expect(agentsMd).toContain("English only");
    expect(markersCmd).toContain("English only");
  });
});

describe("matcha-agy-hooks.js (AGY adapter)", () => {
  const run = (payload, cwd) => {
    const res = spawnSync("node", [join(ROOT, "hooks/matcha-agy-hooks.js")], {
      input: JSON.stringify(payload),
      cwd,
      encoding: "utf-8",
    });
    return JSON.parse(res.stdout);
  };

  test("maps run_command → deny destructive command (rm -rf /)", () => {
    const out = run({ toolCall: { name: "run_command", args: { CommandLine: "rm -rf /" } } });
    expect(out.decision).toBe("deny");
    expect(out.reason).toContain("matcha");
  });

  test("allows safe read-only command (ls -la)", () => {
    const out = run({ toolCall: { name: "run_command", args: { CommandLine: "ls -la" } } });
    expect(out.decision).toBe("allow");
  });

  test("blocks non-plan write via planning gate (no plan file)", () => {
    const tmp = mkdtempSync(join(tmpdir(), "matcha-agy-"));
    const out = run(
      { toolCall: { name: "write_file", args: { FilePath: join(tmp, "src/app.js") } } },
      tmp
    );
    expect(out.decision).toBe("deny");
    expect(out.reason).toContain("Planning Gate");
  });

  test("allows plan file writes (never blocks the plan itself)", () => {
    const tmp = mkdtempSync(join(tmpdir(), "matcha-agy-"));
    const out = run(
      { toolCall: { name: "write_file", args: { FilePath: join(tmp, ".agents/plan/current.md") } } },
      tmp
    );
    expect(out.decision).toBe("allow");
  });

  test("never blocks bash/python commands that WRITE the plan file (anti-deadlock)", () => {
    // Regression: agent can't create current.md when the gate blocks the very
    // command that writes it → deadlock. python3/tee/node -e heredocs must pass.
    const tmp = mkdtempSync(join(tmpdir(), "matcha-agy-"));
    const commands = [
      "python3 -c \"open('.agents/plan/current.md','w').write('x')\"",
      "tee .agents/plan/current.md",
      "node -e \"require('fs').writeFileSync('.agents/plan/current.md','x')\"",
      "mkdir -p .agents/plan && cat << 'EOF' > .agents/plan/current.md",
      "echo plan > /abs/path/.agents/plan/current.md",
    ];
    for (const CommandLine of commands) {
      const out = run({ toolCall: { name: "run_command", args: { CommandLine } } }, tmp);
      expect(out.decision).toBe("allow");
    }
  });

  test("maps real AGY 1.1.10 tool names (view_file, Edit, replace, grep_search)", () => {
    const tmp = mkdtempSync(join(tmpdir(), "matcha-agy-"));

    // read tools always allow
    expect(
      run({ toolCall: { name: "view_file", args: { filePath: "src/x.ts" } } }, tmp).decision
    ).toBe("allow");
    expect(
      run({ toolCall: { name: "grep_search", args: { query: "x" } } }, tmp).decision
    ).toBe("allow");

    // edit/write tools are gated when no plan exists (PascalCase + snake_case)
    expect(
      run({ toolCall: { name: "Edit", args: { TargetFile: join(tmp, "src/x.ts") } } }, tmp).decision
    ).toBe("deny");
    expect(
      run({ toolCall: { name: "replace", args: { TargetFile: join(tmp, "src/x.ts") } } }, tmp).decision
    ).toBe("deny");
    expect(
      run({ toolCall: { name: "write_file", args: { filePath: join(tmp, "src/x.ts") } } }, tmp).decision
    ).toBe("deny");
  });

  test("Edit/replace tools targeting the plan file (TargetFile) are never blocked", () => {
    // AGY passes TargetFile (not FilePath) for its edit tools — plan writes via
    // Edit/replace must be exempt too, otherwise the deadlock returns.
    const tmp = mkdtempSync(join(tmpdir(), "matcha-agy-"));
    expect(
      run(
        { toolCall: { name: "Edit", args: { TargetFile: join(tmp, ".agents/plan/current.md") } } },
        tmp
      ).decision
    ).toBe("allow");
    expect(
      run(
        { toolCall: { name: "replace", args: { TargetFile: join(tmp, ".agents/plan/current.md") } } },
        tmp
      ).decision
    ).toBe("allow");
  });

  test("fail-open on malformed input", () => {
    const res = spawnSync("node", [join(ROOT, "hooks/matcha-agy-hooks.js")], {
      input: "not-json{",
      encoding: "utf-8",
    });
    expect(JSON.parse(res.stdout).decision).toBe("allow");
  });
});
