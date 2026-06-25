/**
 * matcha — OpenCode plugin
 * Injects matcha ruleset every turn and registers slash commands.
 * Add to opencode.json: { "plugin": ["matcha"] }
 */

import { getMatchaInstructions } from "../../hooks/matcha-instructions.js";

export default {
  name: "matcha",
  version: "1.0.2",

  // Inject system prompt every turn
  async onSession(session) {
    const instructions = getMatchaInstructions();
    return {
      system: `
## Active Convention: matcha 🍵
${instructions}

At the END of every task, surface 3 matcha suggestions (casual, slightly sarcastic, actionable).
      `.trim(),
    };
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
