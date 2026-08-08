import { describe, expect, test } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { assertFile, readProjectFile, assertValidSyntax, execSync, ROOT } from "./helpers.js";

describe("bin/matcha.js", () => {
  test("exists", () => assertFile("bin/matcha.js"));

  test("has valid Node syntax", () => assertValidSyntax("bin/matcha.js"));

  const content = readProjectFile("bin/matcha.js");

  test("has init command referencing install.sh", () => {
    expect(content).toContain("init");
    expect(content).toContain("install.sh");
  });

  test("has --platforms flag for scripted provider selection", () => {
    expect(content).toContain("--platforms");
    expect(content).toContain(".opencode,.claude");
  });

  test("has status command with Platform detection", () => {
    expect(content).toContain("status");
    expect(content).toContain("Platform:");
  });

  test("-v / --version prints only the version, not the full help", () => {
    // Regression: -v used to fall through to default → showHelp() dumped the whole usage.
    expect(content).toContain('case "-v":');
    expect(content).toContain('case "--version":');
    expect(content).toContain("🍵 matcha v${VERSION}");
  });

  test("cmdMetrics reuses getMetricsSummary (unified schema, not stale v1)", () => {
    // Regression: cmdMetrics used to read a v1 schema (sessions/tasks/issuesFound)
    // that hooks never write — always showing zeros. Now it reuses the shared
    // getMetricsSummary() so the v2 schema the hooks record is actually shown.
    expect(content).toContain("getMetricsSummary");
    expect(content).not.toContain("issuesFound");
    expect(content).toContain("planningGateBlocks");
  });

  test("BEHAVIORAL: matcha metrics surfaces v2 schema numbers", () => {
    // Write a v2-schema fixture (the shape hooks/matcha-metrics.js records) and
    // confirm `matcha metrics` prints real numbers — proving telemetry is not dead.
    const dir = mkdtempSync(join(tmpdir(), "matcha-metrics-"));
    try {
      mkdirSync(join(dir, ".agents"), { recursive: true });
      writeFileSync(join(dir, ".agents", "matcha-metrics.json"), JSON.stringify({
        version: "2.0.0",
        sessions: [{ date: "2026-08-07", planningGateBlocks: 3, shieldBlocks: 2, reviewIssues: 5 }],
        totals: {
          planningGateBlocks: 3,
          shieldBlocks: 2,
          dangerousCommandsBlocked: 1,
          reviewIssues: 5,
          tasksCompleted: 4,
          reviewsRun: 2,
          reviewVerdicts: { PASS: 1, PASS_WITH_FIXES: 1, BLOCK: 0, EXPERT_REQUIRED: 0 },
          reviewsByTier: { L0: 0, L1: 1, L2: 1, L3: 0 },
          simpleTasksDetected: 7,
          modeSwitches: 2,
        },
      }, null, 2), "utf-8");

      const out = execSync(`node "${join(ROOT, "bin/matcha.js")}" metrics`, {
        cwd: dir,
        encoding: "utf-8",
        timeout: 15_000,
      });

      expect(out).toContain("Tasks:");
      expect(out).toContain("4"); // tasksCompleted
      expect(out).toContain("Planning blocks:");
      expect(out).toContain("3");
      expect(out).toContain("Shield blocks:");
      expect(out).toContain("Issues caught:");
      expect(out).toContain("5");
      expect(out).not.toContain("No metrics yet");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

});
