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
];

describe("Hook syntax", () => {
  test.each(HOOKS)("%s exists", (f) => assertFile(f));
  test.each(HOOKS)(`%s valid Node syntax`, (f) => assertValidSyntax(f));
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

  test("fail-open on malformed input", () => {
    const res = spawnSync("node", [join(ROOT, "hooks/matcha-agy-hooks.js")], {
      input: "not-json{",
      encoding: "utf-8",
    });
    expect(JSON.parse(res.stdout).decision).toBe("allow");
  });
});
