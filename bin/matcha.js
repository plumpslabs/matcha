#!/usr/bin/env node
/**
 * 🍵 matcha CLI
 * Simple. Efficient. Deliberate. Never twice.
 *
 * Usage:
 *   git clone https://github.com/plumpslabs/matcha.git
 *   cd matcha
 *   node bin/matcha.js status   — Show matcha version & platform detection
 *   node bin/matcha.js init     — Install matcha to current directory
 *   node bin/matcha.js help     — Show help
 *
 * Install via:
 *   curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const CWD = process.cwd();
const cmd = process.argv[2];

let VERSION = "0.0.0";
try {
  const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));
  VERSION = pkg.version;
} catch {}

// ─── Help ─────────────────────────────────────────────────────────────────────
function showHelp() {
  console.log(`
🍵 matcha v${VERSION} — Engineering Convention for AI Coding Agents

Usage (from cloned repo):
  node bin/matcha.js status    Show version, platform, and installed components
  node bin/matcha.js init      Install matcha to current directory
  node bin/matcha.js help      Show this help

Install:
  curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash

Docs: https://github.com/plumpslabs/matcha
`);
}

// ─── Init ────────────────────────────────────────────────────────────────────
function cmdInit() {
  console.log(`🍵 matcha init — installing to ${CWD}\n`);

  const installScript = join(PKG_ROOT, "install.sh");
  if (!existsSync(installScript)) {
    console.error("✗ install.sh not found. Are you in the matcha repository?");
    process.exit(1);
  }

  try {
    execSync(`bash "${installScript}"`, { cwd: CWD, stdio: "inherit" });
  } catch (e) {
    console.error(`\n✗ Install failed: ${e.message}`);
    process.exit(1);
  }

  console.log("\n💡 Next steps:");
  console.log("   Run  node bin/matcha.js status   to verify installation");
}

// ─── Status ───────────────────────────────────────────────────────────────────
function cmdStatus() {
  console.log(`🍵 matcha status\n`);

  console.log(`  Version:    v${VERSION}`);

  const platformFolders = [
    [".claude", "Claude Code"],
    [".opencode", "OpenCode"],
    [".cursor", "Cursor"],
    [".agents", "Agentic IDE / Universal"],
    [".clinerules", "Cline / Roo Code"],
    [".windsurf", "Windsurf"],
    [".kiro", "Kiro"],
    [".openclaw", "OpenClaw"],
    [".qoder", "Qoder"],
    [".qwen", "Qwen Code"],
  ];

  const found = [];
  for (const [folder, name] of platformFolders) {
    if (existsSync(join(CWD, folder))) {
      found.push(name);
      const hasRules = existsSync(join(CWD, folder, "rules")) ||
                       existsSync(join(CWD, folder, "steering"));
      const hasAgents = existsSync(join(CWD, folder, "agents"));
      const hasCommands = existsSync(join(CWD, folder, "commands"));
      const parts = [];
      if (hasRules) parts.push("rules");
      if (hasAgents) parts.push("agents");
      if (hasCommands) parts.push("commands");
      console.log(`  Platform:   ${name} (${parts.join(", ") || "detected"})`);
    }
  }

  if (found.length === 0) {
    console.log("  Platform:   (none detected)");
    console.log("  → Run  curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash");
  }

  const hasAgentsMd = existsSync(join(CWD, "AGENTS.md"));
  console.log(`  AGENTS.md:  ${hasAgentsMd ? "✅" : "❌"}`);

  const hasShield = existsSync(join(CWD, "hooks", "matcha-shield.js"));
  console.log(`  Shield:     ${hasShield ? "✅ active" : "⏭ not installed"}`);

  let intensity = process.env.MATCHA_INTENSITY || "enforce (default)";
  try {
    const statePath = join(CWD, ".agents/matcha-state.json");
    if (existsSync(statePath)) {
      const state = JSON.parse(readFileSync(statePath, "utf-8"));
      if (state.intensity) intensity = state.intensity;
    }
  } catch {}
  console.log(`  Intensity:  ${intensity}`);

  console.log(`\n  All systems ${found.length > 0 ? "✅ nominal" : "⏭ pending install"}`);
}

// ─── CLI Router ──────────────────────────────────────────────────────────────
switch (cmd) {
  case "init":
    cmdInit();
    break;
  case "status":
    cmdStatus();
    break;
  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;
  default:
    showHelp();
    break;
}
