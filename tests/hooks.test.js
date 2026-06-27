import { describe, expect, test } from "vitest";
import { assertFile, assertValidSyntax, readProjectFile } from "./helpers.js";

const HOOKS = [
  "hooks/matcha-shield.js",
  "hooks/matcha-post-write.js",
  "hooks/matcha-stop.js",
];

describe("Hook syntax", () => {
  test.each(HOOKS)("%s exists", (f) => assertFile(f));
  test.each(HOOKS)("%s valid Node syntax", (f) => assertValidSyntax(f));
});

test("matcha-shield.js has danger patterns", () => {
  const content = readProjectFile("hooks/matcha-shield.js");
  expect(content).toContain("DANGER_PATTERNS");
});

describe("matcha-post-write.js", () => {
  const content = readProjectFile("hooks/matcha-post-write.js");

  test("has WRITING_CHECKS", () => {
    expect(content).toContain("WRITING_CHECKS");
  });

  test("detects filler phrases", () => {
    expect(content).toContain("filler-phrases");
  });

  test("detects passive voice", () => {
    expect(content).toContain("passive-voice");
  });

  test("detects dead buzzwords", () => {
    expect(content).toContain("dead-words");
  });

  test("detects vague commit messages", () => {
    expect(content).toContain("vague-commit");
  });

  test("has filename scope matching", () => {
    expect(content).toContain("matchesScope");
  });
});

test("matcha-stop.js has relevant patterns", () => {
  const content = readProjectFile("hooks/matcha-stop.js");
  expect(content).toContain("matcha");
});
