/**
 * 🍵 matcha — auto-index.js
 * Automated, zero-touch Symbol Graph & Monorepo Indexer
 * Language-agnostic (TS/JS, Python, Go, Rust, Java, C++, etc.)
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "fs";
import { join, extname, relative } from "path";
import { execSync } from "child_process";
import { getWorkspaceRoot } from "./workspace-root.js";

const EXCLUDED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "target", "vendor",
  ".next", ".turbo", ".cache", ".agents", "coverage", "venv", ".venv", "__pycache__"
]);

const EXTENSIONS = {
  js: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
  py: [".py"],
  go: [".go"],
  rs: [".rs"],
  jvm: [".java", ".kt", ".scala"],
  cpp: [".c", ".cpp", ".cc", ".h", ".hpp"]
};

export function detectMonorepo(root) {
  return (
    existsSync(join(root, "pnpm-workspace.yaml")) ||
    existsSync(join(root, "turbo.json")) ||
    existsSync(join(root, "nx.json")) ||
    existsSync(join(root, "lerna.json")) ||
    existsSync(join(root, "go.work")) ||
    (existsSync(join(root, "Cargo.toml")) && readFileSync(join(root, "Cargo.toml"), "utf8").includes("[workspace]"))
  );
}

export function autoIndexWorkspace(cwd) {
  const root = getWorkspaceRoot(cwd);
  const stateDir = join(root, ".agents", "state");
  if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });

  const isMono = detectMonorepo(root);
  const symbols = [];
  const symbolFile = join(stateDir, "symbols.json");

  try {
    execSync("ctags --version", { stdio: "ignore" });
    const tagsFile = join(stateDir, "tags");
    execSync(`ctags -R -f "${tagsFile}" --exclude=node_modules --exclude=.git --exclude=dist --exclude=target .`, {
      cwd: root,
      stdio: "ignore",
      timeout: 5000
    });
  } catch (e) {
    // Fallback to regex analysis
  }

  function walk(dir, depth = 0) {
    if (depth > 6) return;
    let entries = [];
    try { entries = readdirSync(dir); } catch { return; }

    for (const entry of entries) {
      if (EXCLUDED_DIRS.has(entry) || entry.startsWith(".")) continue;
      const fullPath = join(dir, entry);
      let st;
      try { st = statSync(fullPath); } catch { continue; }

      if (st.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (st.isFile()) {
        const ext = extname(entry).toLowerCase();
        const rel = relative(root, fullPath);

        if (EXTENSIONS.js.includes(ext) || EXTENSIONS.py.includes(ext) || EXTENSIONS.go.includes(ext) || EXTENSIONS.rs.includes(ext)) {
          try {
            const fileContent = readFileSync(fullPath, "utf8");
            const lines = fileContent.split("\n");
            lines.forEach((line, idx) => {
              const trimmed = line.trim();
              if (
                trimmed.startsWith("export ") ||
                trimmed.startsWith("func ") ||
                trimmed.startsWith("def ") ||
                trimmed.startsWith("class ") ||
                trimmed.startsWith("pub fn ") ||
                trimmed.startsWith("pub struct ") ||
                trimmed.startsWith("pub enum ") ||
                trimmed.startsWith("type ") ||
                trimmed.startsWith("interface ")
              ) {
                symbols.push({
                  file: rel,
                  line: idx + 1,
                  sig: trimmed.slice(0, 120)
                });
              }
            });
          } catch {}
        }
      }
    }
  }

  walk(root);

  const manifest = {
    generatedAt: new Date().toISOString(),
    isMonorepo: isMono,
    totalSymbols: symbols.length,
    symbols: symbols.slice(0, 2000)
  };

  writeFileSync(symbolFile, JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

if (process.argv[1] && process.argv[1].endsWith("auto-index.js")) {
  const result = autoIndexWorkspace(process.cwd());
  console.log(`🍵 matcha auto-index: Indexed ${result.totalSymbols} symbols (Monorepo: ${result.isMonorepo})`);
}
