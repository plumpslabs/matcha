import { describe, expect, test } from "vitest";
import { assertFile, assertValidSyntax, readProjectFile, TASK_IDS } from "./helpers.js";

describe("Benchmark files exist", () => {
  test("benchmark/matcha-bench.js exists", () => assertFile("benchmark/matcha-bench.js"));
  test("benchmark/agentic-runner.js exists", () => assertFile("benchmark/agentic-runner.js"));
  test("benchmark/generate-report.js exists", () => assertFile("benchmark/generate-report.js"));
  test("benchmark/live-repo-runner.js exists", () => assertFile("benchmark/live-repo-runner.js"));
  test("benchmark/repo-tasks.json exists", () => assertFile("benchmark/repo-tasks.json"));

  test("package.json has benchmark script", () => {
    const pkg = readProjectFile("package.json");
    expect(pkg).toContain('"benchmark"');
  });
});

describe("Benchmark syntax", () => {
  test("matcha-bench.js valid syntax", () => assertValidSyntax("benchmark/matcha-bench.js"));
  test("agentic-runner.js valid syntax", () => assertValidSyntax("benchmark/agentic-runner.js"));
  test("generate-report.js valid syntax", () => assertValidSyntax("benchmark/generate-report.js"));
  test("live-repo-runner.js valid syntax", () => assertValidSyntax("benchmark/live-repo-runner.js"));
});

describe("matcha-bench.js features", () => {
  const content = readProjectFile("benchmark/matcha-bench.js");

  test("has agentic benchmark mode", () => {
    expect(content).toContain("TASKS");
    expect(content).toContain("runAgenticBenchmark");
    expect(content).toContain("--agentic");
    expect(content).toContain("correctness");
    expect(content).toContain("countLOC");
    expect(content).toContain("estimateTokens");
  });

  test("has 3 arms (baseline, matcha, terse)", () => {
    expect(content).toContain("ARMS");
    expect(content).toContain("terse");
    expect(content).toContain("defaultTerse");
  });

  test("has adversarial testing with injection patterns", () => {
    expect(content).toContain("adversarialTest");
    expect(content).toContain("adversarial");
    expect(content).toContain("script");
    expect(content).toContain("../");
    expect(content).toContain("NaN");
  });

  test("has --iters flag with median/majority", () => {
    expect(content).toContain("--iters");
    expect(content).toContain("median(lLocs)");
    expect(content).toContain("majority(correctVotes)");
    expect(content).toContain("iterations <= 1");
    expect(content).toContain("n: iterations");
  });

  test("has over-build tasks", () => {
    expect(content).toContain("OVERBUILD_TASKS");
    expect(content).toContain("date-fmt");
    expect(content).toContain("log-filter");
  });

  test("report shows 3 arms comparison", () => {
    const hasArmInsight =
      content.includes("matcha beats terse") ||
      content.includes("terse beats matcha") ||
      content.includes("matcha ≈ terse");
    expect(hasArmInsight).toBe(true);
    expect(content).toContain("Adversarial:");
  });
});

describe("agentic-runner.js features", () => {
  const content = readProjectFile("benchmark/agentic-runner.js");

  test("has runAgenticLive orchestrator", () => {
    expect(content).toContain("runAgenticLive");
  });

  test("has task discovery", () => {
    expect(content).toContain("discoverTasks");
  });

  test("has matcha injection", () => {
    expect(content).toContain("injectMatcha");
  });

  test("has adversarial gate", () => {
    expect(content).toContain("runAdversarialTest");
    expect(content).toContain("adversarial");
    expect(content).toContain("XSS");
    expect(content).toContain("path traversal");
    expect(content).toContain("NaN");
  });

  test("has --iters flag with multi-run loop", () => {
    expect(content).toContain("--iters");
    expect(content).toContain("for (let i = 0; i < iterations; i++)");
    expect(content).toContain("medianLoc");
  });
});

describe("generate-report.js features", () => {
  const content = readProjectFile("benchmark/generate-report.js");

  test("has --iters flag passthrough", () => {
    expect(content).toContain("--iters");
    expect(content).toContain("iterations");
    expect(content).toContain("iteration(s) per cell");
  });
});

describe("live-repo-runner.js features", () => {
  const content = readProjectFile("benchmark/live-repo-runner.js");

  test("has runRepoTasks", () => {
    expect(content).toContain("runRepoTasks");
  });

  test("has runLiveRepoBenchmark orchestrator", () => {
    expect(content).toContain("runLiveRepoBenchmark");
  });

  test("has cloneFixture", () => {
    expect(content).toContain("cloneFixture");
  });

  test("has injectMatchaRules", () => {
    expect(content).toContain("injectMatchaRules");
  });

  test("has measureChanges (git diff)", () => {
    expect(content).toContain("measureChanges");
  });

  test("has complianceScore", () => {
    expect(content).toContain("complianceScore");
  });
});

describe("Task fixtures", () => {
  test.each(TASK_IDS)("%s has spec.md and test.js", (task) => {
    assertFile(`benchmark/tasks/${task}/spec.md`);
    assertFile(`benchmark/tasks/${task}/test.js`);
  });

  for (const task of TASK_IDS) {
    test(`${task}/test.js has adversarial checks`, () => {
      const content = readProjectFile(`benchmark/tasks/${task}/test.js`);
      expect(content).toContain("FAIL:");
      const checkCalls = (content.match(/check\(/g) || []).length;
      const assertions = (content.match(/console\.error\(/g) || []).length;
      expect(checkCalls >= 5 || assertions >= 3).toBe(true);
    });
  }
});

describe("repo-tasks.json", () => {
  const raw = readProjectFile("benchmark/repo-tasks.json");
  const tasks = JSON.parse(raw);

  test("is parseable array with 3+ tasks", () => {
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThanOrEqual(3);
  });

  test.each(tasks)("$id has all required fields", (t) => {
    expect(t.id).toBeTruthy();
    expect(t.name).toBeTruthy();
    expect(t.description).toBeTruthy();
    expect(t.repo).toBeTruthy();
    expect(t.verifyCommands).toBeTruthy();
    expect(t.successCriteria).toBeTruthy();
  });
});

describe("express-api fixture", () => {
  const fixtureFiles = [
    "package.json", "src/index.js", "src/routes/users.js",
    "src/middleware/auth.js", "tests/users.test.js", "tests/server.test.js",
  ];
  test.each(fixtureFiles)("repos/express-api/%s exists", (f) => {
    assertFile(`benchmark/repos/express-api/${f}`);
  });
});

describe("matcha-bench references agentic-runner", () => {
  const content = readProjectFile("benchmark/matcha-bench.js");
  test("has --agentic-live flag", () => {
    expect(content).toContain("--agentic-live");
  });
  test("imports runAgenticLive", () => {
    expect(content).toContain("runAgenticLive");
  });
});
