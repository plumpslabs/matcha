/**
 * 🍵 matcha — evidence-collector.js
 * Machine-readable evidence collector.
 * Prevents "Theater of Compliance" by capturing empirical proof:
 * actual test runner exit codes, execution timestamps, git diff stats,
 * and blast-radius risk tier.
 *
 * Persists to: <workspace_root>/.agents/state/evidence.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "./workspace-root.js";
import { calculateBlastRadius } from "./blast-radius.js";

export function getEvidencePath(cwd) {
  const root = getWorkspaceRoot(cwd);
  return join(root, ".agents", "state", "evidence.json");
}

/**
 * Record empirical test execution proof.
 * @param {{
 *   command: string,
 *   exitCode: number,
 *   outputSnippet?: string,
 *   passed?: number,
 *   failed?: number
 * }} testData
 * @param {string} [cwd]
 */
export function recordTestEvidence(testData, cwd) {
  const root = getWorkspaceRoot(cwd);
  const evidenceFile = getEvidencePath(root);
  const dir = join(evidenceFile, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let current = {};
  try {
    if (existsSync(evidenceFile)) {
      current = JSON.parse(readFileSync(evidenceFile, "utf-8"));
    }
  } catch {}

  const blast = calculateBlastRadius(undefined, root);

  const bundle = {
    ...current,
    timestamp: new Date().toISOString(),
    tests: {
      command: testData.command,
      exitCode: testData.exitCode,
      passed: testData.passed ?? null,
      failed: testData.failed ?? null,
      outputSnippet: (testData.outputSnippet || "").substring(0, 500),
      timestamp: new Date().toISOString(),
    },
    risk: {
      tier: blast.tier,
      score: blast.score,
      reasons: blast.reasons,
    },
    git: {
      filesChanged: blast.stats.filesChanged,
      linesAdded: blast.stats.linesAdded,
      linesDeleted: blast.stats.linesDeleted,
    },
    verified: testData.exitCode === 0,
  };

  try {
    writeFileSync(evidenceFile, JSON.stringify(bundle, null, 2) + "\n", "utf-8");
  } catch {}

  return bundle;
}

/**
 * Read the current evidence bundle.
 * @param {string} [cwd]
 * @returns {object|null}
 */
export function getEvidenceBundle(cwd) {
  try {
    const p = getEvidencePath(cwd);
    if (!existsSync(p)) return null;
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Validate that an empirical test run exists and passed (exitCode === 0).
 * @param {string} [requiredTier]
 * @param {string} [cwd]
 * @returns {{ valid: boolean, message: string }}
 */
export function validateEvidence(requiredTier = "L1", cwd) {
  const bundle = getEvidenceBundle(cwd);
  if (!bundle || !bundle.tests) {
    return {
      valid: false,
      message: "No empirical test evidence bundle found in .agents/state/evidence.json. Run tests via test runner before declaring completion.",
    };
  }

  if (bundle.tests.exitCode !== 0) {
    return {
      valid: false,
      message: `Test evidence shows failure (command: "${bundle.tests.command}", exitCode: ${bundle.tests.exitCode}). Fix errors and verify green.`,
    };
  }

  return {
    valid: true,
    message: `Verified empirical test evidence: "${bundle.tests.command}" passed cleanly at ${bundle.tests.timestamp}`,
  };
}
