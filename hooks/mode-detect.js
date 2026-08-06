/**
 * 🍵 matcha — mode-detect.js
 * Context-aware mode detection. Auto-detects what the agent is doing.
 *
 * Exports:
 *   detectMode(toolName, input) — returns mode string
 *   writeMode(mode) — writes mode to state file
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "./workspace-root.js";

const ROOT = getWorkspaceRoot();
const STATE_FILE = join(ROOT, ".agents/matcha-state.json");

// ─── Mode Patterns ────────────────────────────────────────────────────────

const MODE_PATTERNS = {
  explore: [
    /^(cat|ls|find|grep|head|tail|wc|echo|pwd|which|tree)\b/i,
    /^git\s+(status|log|diff|show|branch|remote|tag)\b/i,
    /^(npm ls|npm list|pip list|cargo tree|go list)\b/i,
  ],
  debug: [
    /^(npm test|npx vitest|vitest|jest|mocha|pytest|go test|cargo test)\b/i,
    /console\.log|debugger|breakpoint/i,
    /error|fail|crash|stack.?trace/i,
  ],
  review: [
    /\/review|\/audit|\/why/i,
    /eslint|prettier|black|ruff|gofmt|rustfmt/i,
  ],
  refactor: [
    /refactor|rename|extract|move|inline|dedupe/i,
    /^git\s+(stash|reset|checkout)\b/i,
  ],
  implement: [
    /implement|create|add|build|write|new/i,
  ],
};

export function detectMode(toolName, input) {
  const cmd = (input?.command || input?.code || "").trim();
  const target = (input?.path || input?.TargetFile || input?.filePath || "").trim();
  const text = `${cmd} ${target}`;

  for (const [mode, patterns] of Object.entries(MODE_PATTERNS)) {
    if (patterns.some(p => p.test(text))) return mode;
  }
  return "implement"; // default
}

export function writeMode(mode) {
  try {
    const stateDir = join(ROOT, ".agents");
    let state = {};
    try {
      state = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    } catch {}
    if (state.mode !== mode) {
      state.mode = mode;
      state.modeChangedAt = new Date().toISOString();
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    }
  } catch {}
}

export function getPreviousMode() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return {};
  }
}
