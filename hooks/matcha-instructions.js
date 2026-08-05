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
  const skill = readFileSync(skillPath, "utf-8");
  return skill + `

## Operational Triggers (always active)
- **Planning gate fires BEFORE the first code edit.** The moment you are about to write/modify a non-.md file for the first time in a task, you MUST overwrite \`.agents/plan/current.md\` with the Intent Discovery plan first. Do not wait for a user command — the hook blocks writes without it.
- Plan file: \`.agents/plan/current.md\` (frontmatter + Problem/Goals/Success Criteria/What→Why→How). A legacy \`<matcha_gate>\` XML at \`.agents/matcha-plan.md\` also satisfies the hook.
- Read \`.agents/plan/current.md\` at task start; intent mismatch → overwrite, never follow a stale plan. Task done → archive to \`.agents/reports/planner-<YYYY-MM>.md\` + reset.
`;
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
