#!/usr/bin/env node
/**
 * 🍵 matcha — matcha-context-index.js
 * Auto-builds living context index from codebase.
 *
 * Generates 3 index files:
 *   .agents/matcha-index.json    — Module map, exports, deps, risk levels
 *   .agents/matcha-arch.json     — Architecture layers, circular deps, god objects
 *   .agents/matcha-changes.json  — Recent changes log (last 50 commits)
 *
 * Triggered: post-write hook OR CLI: `node hooks/matcha-context-index.js`
 *
 * Matcha-style: deterministic, fast, no dependencies.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname, relative, extname, basename } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const AGENTS_DIR = join(ROOT, ".agents");

// ─── Config ──────────────────────────────────────────────────────────────────

const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts",
  ".py", ".go", ".rs", ".rb", ".java", ".kt", ".swift",
  ".vue", ".svelte", ".astro",
]);

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "coverage", ".next",
  "target", "vendor", "__pycache__", ".venv", "venv",
]);

const TEST_PATTERNS = [".test.", ".spec.", ".test_", "test_", "__tests__"];
const CONFIG_EXTENSIONS = new Set([".json", ".yaml", ".yml", ".toml", ".env"]);

// ─── Risk Detection (from trigger packs) ─────────────────────────────────────

function getRiskLevel(filePath, content) {
  const relPath = relative(ROOT, filePath);
  const lower = relPath.toLowerCase();
  const contentLower = (content || "").toLowerCase();

  // L0: disposable paths
  if (/\/(tmp|temp|scratch|debug|sandbox)\//.test(lower)) return "L0";

  // L3: high-risk paths
  if (/\/(auth|payment|crypto|security|migrations?)\//.test(lower)) return "L3";

  // L3: high-risk keywords in content
  const l3Keywords = /\b(password|token|secret|encrypt|hash|session|jwt|oauth|chmod|sudo)\b/i;
  if (l3Keywords.test(content)) return "L3";

  // L1: test files, docs, fixtures
  if (TEST_PATTERNS.some(p => lower.includes(p))) return "L1";
  if (/\.(md|txt)$/.test(lower)) return "L1";
  if (/\/(test|tests|__tests__|spec|fixtures|mocks)\//.test(lower)) return "L1";

  // L2: everything else that's code
  return "L2";
}

// ─── Extract Exports ─────────────────────────────────────────────────────────

function extractExports(content, filePath) {
  const ext = extname(filePath);
  const exports = [];

  // JS/TS: export function/class/const/var
  if (/\.(js|jsx|ts|tsx|mjs|mts|cjs|cts)$/.test(ext)) {
    const patterns = [
      /export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)/g,
      /export\s+(?:default\s+)?class\s+(\w+)/g,
      /export\s+(?:default\s+)?(?:const|let|var)\s+(\w+)/g,
      /module\.exports\s*=\s*(\w+)/g,
      /exports\.(\w+)\s*=/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !exports.includes(match[1])) exports.push(match[1]);
      }
    }
  }

  // Python: def, class
  if (ext === ".py") {
    const patterns = [
      /def\s+(\w+)\s*\(/g,
      /class\s+(\w+)/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !match[1].startsWith("_") && !exports.includes(match[1])) {
          exports.push(match[1]);
        }
      }
    }
  }

  // Go: func, type
  if (ext === ".go") {
    const patterns = [
      /func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/g,
      /type\s+(\w+)\s+(?:struct|interface)/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && /^[A-Z]/.test(match[1]) && !exports.includes(match[1])) {
          exports.push(match[1]);
        }
      }
    }
  }

  // Rust: pub fn, pub struct, pub enum
  if (ext === ".rs") {
    const patterns = [
      /pub\s+(?:async\s+)?fn\s+(\w+)/g,
      /pub\s+(?:struct|enum|trait|type)\s+(\w+)/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !exports.includes(match[1])) exports.push(match[1]);
      }
    }
  }

  return exports.slice(0, 20); // cap at 20 to keep index small
}

// ─── Extract Imports/Dependencies ────────────────────────────────────────────

function extractImports(content, filePath) {
  const ext = extname(filePath);
  const imports = [];

  if (/\.(js|jsx|ts|tsx|mjs|mts|cjs|cts)$/.test(ext)) {
    const patterns = [
      /import\s+.*?from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !match[1].startsWith(".") && !imports.includes(match[1])) {
          imports.push(match[1]);
        }
      }
    }
  }

  if (ext === ".py") {
    const patterns = [
      /from\s+(\S+)\s+import/g,
      /import\s+(\S+)/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !match[1].startsWith(".") && !imports.includes(match[1])) {
          imports.push(match[1]);
        }
      }
    }
  }

  if (ext === ".go") {
    const pattern = /import\s+(?:\(\s*\n)?((?:.*?["'].+?["']\s*\n?)+)/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const block = match[1];
      const paths = block.match(/"([^"]+)"/g) || [];
      for (const p of paths) {
        const clean = p.replace(/"/g, "");
        if (!clean.startsWith(".") && !imports.includes(clean)) imports.push(clean);
      }
    }
  }

  return imports.slice(0, 15);
}

// ─── Count Lines ─────────────────────────────────────────────────────────────

function countLines(content) {
  return content.split("\n").length;
}

// ─── Detect Language ─────────────────────────────────────────────────────────

function detectLanguage(filePath) {
  const ext = extname(filePath);
  const langMap = {
    ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript", ".cjs": "javascript",
    ".ts": "typescript", ".tsx": "typescript", ".mts": "typescript", ".cts": "typescript",
    ".py": "python", ".go": "go", ".rs": "rust", ".rb": "ruby",
    ".java": "java", ".kt": "kotlin", ".swift": "swift",
    ".vue": "vue", ".svelte": "svelte",
    ".json": "json", ".yaml": "yaml", ".yml": "yaml", ".toml": "toml",
    ".md": "markdown", ".txt": "text",
  };
  return langMap[ext] || "unknown";
}

// ─── Walk Codebase ───────────────────────────────────────────────────────────

function walkCodebase(dir, files = [], depth = 0) {
  if (depth > 10) return files;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith(".") && !entry.name.startsWith(".agents")) continue;

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walkCodebase(fullPath, files, depth + 1);
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if (CODE_EXTENSIONS.has(ext) || CONFIG_EXTENSIONS.has(ext)) {
          const relPath = relative(ROOT, fullPath);
          const lines = countLines(readFileSync(fullPath, "utf-8"));
          if (lines > 0) files.push({ path: relPath, fullPath, lines, ext });
        }
      }
    }
  } catch {}
  return files;
}

// ─── Build matcha-index.json ─────────────────────────────────────────────────

function buildIndex() {
  const files = walkCodebase(ROOT);
  const modules = {};
  const dependencies = {};
  const entryPoints = [];
  const languages = {};
  let totalLines = 0;

  for (const file of files) {
    const content = readFileSync(file.fullPath, "utf-8");
    const exports = extractExports(content, file.fullPath);
    const imports = extractImports(content, file.fullPath);
    const risk = getRiskLevel(file.fullPath, content);
    const lang = detectLanguage(file.path);

    // Track languages
    languages[lang] = (languages[lang] || 0) + 1;
    totalLines += file.lines;

    // Detect entry points (has exports, or is main index file)
    if (exports.length > 0 || /\/(index|main|app)\.\w+$/.test(file.path)) {
      entryPoints.push(file.path);
    }

    modules[file.path] = {
      exports: exports.length > 0 ? exports : undefined,
      imports: imports.length > 0 ? imports : undefined,
      language: lang,
      lines: file.lines,
      riskLevel: risk,
    };
  }

  // Build dependency graph (internal deps only)
  for (const [filePath, mod] of Object.entries(modules)) {
    if (mod.imports) {
      const internalDeps = mod.imports.filter(imp => {
        // Check if it resolves to an internal file
        const candidate1 = join(ROOT, imp);
        const candidate2 = join(ROOT, imp + ".js");
        const candidate3 = join(ROOT, imp + ".ts");
        return existsSync(candidate1) || existsSync(candidate2) || existsSync(candidate3);
      });
      if (internalDeps.length > 0) {
        dependencies[filePath] = internalDeps;
      }
    }
  }

  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    stats: {
      files: Object.keys(modules).length,
      totalLines,
      languages,
    },
    modules,
    dependencies,
    entryPoints,
    languages,
  };
}

// ─── Build matcha-arch.json ──────────────────────────────────────────────────

function buildArch() {
  const files = walkCodebase(ROOT);

  // Auto-detect layers from directory structure
  const layerMap = {};
  for (const file of files) {
    const parts = file.path.split("/");
    // Use first meaningful directory as layer name
    let layer = "root";
    for (const part of parts) {
      if (IGNORE_DIRS.has(part) || part.startsWith(".")) continue;
      if (CODE_EXTENSIONS.has(extname(part))) break;
      layer = part;
      break;
    }
    if (!layerMap[layer]) layerMap[layer] = [];
    layerMap[layer].push(file.path);
  }

  // Detect circular deps
  const dependencies = buildIndex().dependencies;
  const circularDeps = [];
  for (const [file, deps] of Object.entries(dependencies)) {
    for (const dep of deps) {
      if (dependencies[dep] && dependencies[dep].includes(file)) {
        const pair = [file, dep].sort().join(" <-> ");
        if (!circularDeps.includes(pair)) circularDeps.push(pair);
      }
    }
  }

  // Detect god objects (>300 LOC)
  const godObjects = [];
  for (const file of files) {
    if (file.lines > 300) {
      godObjects.push({ path: file.path, lines: file.lines });
    }
  }

  // Build layers
  const layers = {};
  for (const [name, paths] of Object.entries(layerMap)) {
    const riskCounts = { L0: 0, L1: 0, L2: 0, L3: 0 };
    for (const p of paths) {
      const ext = extname(p);
      if (TEST_PATTERNS.some(tp => p.includes(tp))) riskCounts.L0++;
      else if (/\.(md|txt)$/.test(p)) riskCounts.L1++;
      else riskCounts.L2++;
    }
    layers[name] = {
      files: paths,
      fileCount: paths.length,
      risk: riskCounts,
    };
  }

  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    layers,
    circularDeps,
    godObjects,
  };
}

// ─── Build matcha-changes.json ───────────────────────────────────────────────

function buildChanges() {
  const changes = [];
  try {
    const log = execSync("git log --oneline --name-status -50 2>/dev/null || true", {
      cwd: ROOT,
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const lines = log.split("\n");
    let currentCommit = null;

    for (const line of lines) {
      // Commit hash line: "abc1234 Commit message"
      const commitMatch = line.match(/^([a-f0-9]{7,12})\s+(.+)/);
      if (commitMatch) {
        currentCommit = {
          hash: commitMatch[1],
          message: commitMatch[2],
          files: [],
        };
        continue;
      }

      // File status line: "M\tpath/to/file.js"
      if (currentCommit) {
        const fileMatch = line.match(/^([ADMR])\t(.+)/);
        if (fileMatch) {
          const action = { A: "added", D: "deleted", M: "modified", R: "renamed" }[fileMatch[1]] || "modified";
          const filePath = fileMatch[2];

          // Only track code files
          if (CODE_EXTENSIONS.has(extname(filePath))) {
            currentCommit.files.push({
              file: filePath,
              action,
              riskLevel: getRiskLevel(filePath, ""),
            });
          }
        }
      }

      // Empty line = end of commit
      if (line.trim() === "" && currentCommit) {
        if (currentCommit.files.length > 0) {
          changes.push(currentCommit);
        }
        currentCommit = null;
      }
    }

    // Push last commit
    if (currentCommit && currentCommit.files.length > 0) {
      changes.push(currentCommit);
    }
  } catch {}

  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    totalCommits: changes.length,
    changes: changes.slice(0, 50),
  };
}

// ─── Format ──────────────────────────────────────────────────────────────────

function formatSummary(index, arch, changes) {
  const mods = Object.keys(index.modules).length;
  const entryPts = index.entryPoints.length;
  const godObjs = arch.godObjects.length;
  const circDeps = arch.circularDeps.length;
  const recentChanges = changes.changes.length;

  let msg = `🍵 matcha: context index built\n\n`;
  msg += `📊 Index:\n`;
  msg += `  Files: ${mods}\n`;
  msg += `  Entry points: ${entryPts}\n`;
  msg += `  Languages: ${Object.entries(index.languages).map(([k,v]) => `${k}(${v})`).join(", ")}\n`;
  msg += `  Total LOC: ${index.stats.totalLines}\n\n`;

  if (godObjs > 0) {
    msg += `🔴 Architecture:\n`;
    msg += `  God objects: ${godObjs} (>300 LOC)\n`;
    for (const g of arch.godObjects) {
      msg += `    ${g.path}: ${g.lines} lines\n`;
    }
    msg += `\n`;
  }

  if (circDeps > 0) {
    msg += `🟡 Circular deps: ${circDeps}\n`;
    for (const c of arch.circularDeps) {
      msg += `    ${c}\n`;
    }
    msg += `\n`;
  }

  msg += `📝 Recent: ${recentChanges} commits tracked\n`;
  return msg;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  // Ensure .agents dir exists
  if (!existsSync(AGENTS_DIR)) mkdirSync(AGENTS_DIR, { recursive: true });

  const index = buildIndex();
  const arch = buildArch();
  const changes = buildChanges();

  // Write files
  writeFileSync(join(AGENTS_DIR, "matcha-index.json"), JSON.stringify(index, null, 2) + "\n");
  writeFileSync(join(AGENTS_DIR, "matcha-arch.json"), JSON.stringify(arch, null, 2) + "\n");
  writeFileSync(join(AGENTS_DIR, "matcha-changes.json"), JSON.stringify(changes, null, 2) + "\n");

  // Output summary
  const summary = formatSummary(index, arch, changes);
  console.log(summary);

  return { index, arch, changes };
}

// ─── CLI Mode ────────────────────────────────────────────────────────────────

const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-context-index.js") ||
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-context-index")
);

if (isDirectInvocation) {
  main();
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export { buildIndex, buildArch, buildChanges };
export default main;
