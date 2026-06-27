import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export { __dirname, ROOT };

export function countLOC(code) {
  return code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//")).length;
}

export function estimateTokens(code) {
  return Math.ceil(code.length / 4);
}

export function checkTool(name) {
  try {
    execSync(`which ${name} 2>/dev/null || where ${name} 2>nul`, { stdio: "pipe", timeout: 5000, encoding: "utf-8" });
    return true;
  } catch { return false; }
}
