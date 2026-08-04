/**
 * matcha — matcha-instructions.js
 * Shared instruction builder — single source of truth for all adapters.
 * ESM module (compatible with package.json "type": "module").
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export function getMatchaInstructions() {
  const skillPath = join(ROOT, "skills", "matcha", "SKILL.md");
  return readFileSync(skillPath, "utf-8");
}

export function getProjectConstraints() {
  // Look for MATCHA_PROJECT.md in current working directory
  const projectPaths = [
    join(process.cwd(), "MATCHA_PROJECT.md"),
    join(ROOT, "skills", "matcha", "modules", "project.md"),
  ];
  for (const p of projectPaths) {
    try {
      const content = readFileSync(p, "utf-8");
      if (content.trim().length > 50) return content;
    } catch {}
  }
  return null;
}
