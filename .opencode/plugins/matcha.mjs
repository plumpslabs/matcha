/**
 * 🍵 matcha — OpenCode plugin
 * Injects matcha ruleset every turn, registers slash commands,
 * and hooks into tool lifecycle for deterministic enforcement.
 *
 * Add to opencode.json: { "plugin": ["matcha"] }
 */

import { getMatchaInstructions } from "../../hooks/matcha-instructions.js";

const DANGER_PATTERNS = [
  /^rm\s+-rf?\s+\/\s*$/,
  /^rm\s+-rf?\s+~\s*$/,
  /^rm\s+-rf?\s+\.\s*$/,
  /^chmod\s+777(\s|$)/,
  /^git\s+push\s+--force(\s|$)/,
  /\bdrop\s+database\b/i,
  /\btruncate\s+table\b/i,
  /^(curl|wget)\s+.*\|(bash|sh)\s*$/,
];

function isDangerous(command) {
  return DANGER_PATTERNS.some((p) => p.test(command));
}

export default {
  name: "matcha",
  version: "2.0.0",
  description: "🍵 matcha engineering convention — simple, efficient, deliberate",

  // Inject system prompt every turn
  hooks: {
    "session.created": async (ctx) => {
      const instructions = getMatchaInstructions();
      return {
        system: `
## Active Convention: matcha 🍵
${instructions}

### End-of-Task
Check the 3 items below before wrapping up:
1. ⚡ Efficiency — any debug code, empty catches, or oversized functions?
2. 🔎 Reuse — could any new code reuse existing implementations?
3. 🧹 Cleanup — any temp files or uncommitted artifacts?
        `.trim(),
      };
    },

    // Block dangerous commands before execution
    "tool.execute.before": async (input, output) => {
      if (input.tool === "Bash" && input.args?.command) {
        const cmd = input.args.command.trim();
        if (isDangerous(cmd)) {
          throw new Error(
            `🍵 matcha: shield blocked\n\nCommand: ${cmd}\nThis command is destructive. Use a specific path or --force-with-lease.`
          );
        }
      }
    },

    // No PostToolUse hook needed here — matcha hooks system handles cleanup
    // via .claude/settings.json (PostToolUse) for Claude Code,
    // and via inline instructions in session.created for other platforms.
  },

  // Register slash commands
  commands: {
    "matcha:why": {
      description: "Run 5W1H check on current task",
      file: "../../commands/why.md",
    },
    "matcha:audit": {
      description: "Audit stack for overlaps and inefficiencies",
      file: "../../commands/audit.md",
    },
    "matcha:review": {
      description: "Post-implementation efficiency review",
      file: "../../commands/review.md",
    },
  },
};
