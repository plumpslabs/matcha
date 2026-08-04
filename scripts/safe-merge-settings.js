#!/usr/bin/env node
/**
 * 🍵 matcha — safe-merge-settings.js
 * Safely merges matcha hooks into .claude/settings.json
 * WITHOUT overwriting existing hooks from other tools.
 *
 * Usage: node scripts/safe-merge-settings.js [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

const MATCHA_HOOKS = {
  PreToolUse: [
    {
      matcher: "Bash",
      hooks: [
        {
          type: "command",
          command: "node ${CLAUDE_PLUGIN_ROOT}/hooks/matcha-shield.js",
          timeout: 5000,
        },
      ],
    },
  ],
  PostToolUse: [
    {
      hooks: [
        {
          type: "command",
          command: "node ${CLAUDE_PLUGIN_ROOT}/hooks/matcha-post-write.js",
          timeout: 3000,
        },
      ],
    },
  ],
  Stop: [
    {
      hooks: [
        {
          type: "command",
          command: "node ${CLAUDE_PLUGIN_ROOT}/hooks/matcha-stop.js",
          timeout: 5000,
        },
      ],
    },
  ],
};

function isMatchaHook(hook) {
  const cmd = hook.command || hook.hooks?.[0]?.command || "";
  return cmd.includes("matcha-shield") || cmd.includes("matcha-post-write") || cmd.includes("matcha-stop");
}

function mergeHooks(existing, matcha) {
  const merged = { ...existing };

  for (const [event, matchaEntries] of Object.entries(matcha)) {
    if (!merged[event]) {
      merged[event] = matchaEntries;
      continue;
    }

    // Remove old matcha hooks (replace with new versions)
    merged[event] = merged[event].filter((entry) => {
      if (entry.hooks) {
        return !entry.hooks.some(isMatchaHook);
      }
      return true;
    });

    // Add new matcha hooks
    merged[event].push(...matchaEntries);
  }

  return merged;
}

// Main
const settingsPath = join(ROOT, ".claude", "settings.json");
let settings = { hooks: {} };

if (existsSync(settingsPath)) {
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    if (!settings.hooks) settings.hooks = {};
  } catch {
    console.warn("⚠️  Could not parse existing settings.json, creating new one");
  }
}

const before = JSON.stringify(settings.hooks, null, 2);
settings.hooks = mergeHooks(settings.hooks, MATCHA_HOOKS);
const after = JSON.stringify(settings.hooks, null, 2);

if (before === after) {
  console.log("✅ Settings already up to date");
} else {
  console.log("📝 Merging matcha hooks into .claude/settings.json");
  if (DRY_RUN) {
    console.log("\n--- DRY RUN ---\n");
    console.log("Before:", before.substring(0, 200) + "...");
    console.log("\nAfter:", after.substring(0, 200) + "...");
  } else {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
    console.log("✅ Settings updated");
  }

  // Show what was added
  for (const [event, hooks] of Object.entries(MATCHA_HOOKS)) {
    const existing = settings.hooks[event] || [];
    const matchaCount = existing.filter((h) => h.hooks?.some(isMatchaHook)).length;
    const otherCount = existing.length - matchaCount;
    console.log(`  ${event}: ${matchaCount} matcha + ${otherCount} other = ${existing.length} total`);
  }
}
