import { describe, expect, test } from "vitest";
import { assertFile, assertValidSyntax, readProjectFile } from "./helpers.js";

const HOOKS = [
  "hooks/matcha-shield.js",
  "hooks/matcha-post-write.js",
  "hooks/matcha-stop.js",
  "hooks/matcha-mcp-server.js",
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
