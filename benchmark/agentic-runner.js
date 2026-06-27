#!/usr/bin/env node
/**
 * 🍵 matcha — agentic-runner.js
 * Real Claude Code A/B/C benchmark runner.
 *
 * Spawns headless Claude Code sessions for each task × arm combination,
 * captures generated code, verifies correctness, and reports results.
 *
 * Usage:
 *   node benchmark/agentic-runner.js                        ← full run (all arms × all tasks)
 *   node benchmark/agentic-runner.js --arm matcha           ← single arm only
 *   node benchmark/agentic-runner.js --task email-validator  ← single task only
 *   node benchmark/agentic-runner.js --keep                  ← keep temp dirs for inspection
 *   node benchmark/agentic-runner.js --simulate              ← skip Claude, use default solutions
 *
 * Matcha-style: deterministic, parallel where possible, clean output.
 */

import { execSync, spawn } from "child_process";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdtempSync,
  rmSync,
  mkdirSync,
  readdirSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TASKS_DIR = join(__dirname, "tasks");
const MATCHA_RULES = join(__dirname, "..", ".claude");

// ─── Arms ──────────────────────────────────────────────────────────────────

const ARMS = [
  {
    id: "baseline",
    label: "No rules",
    desc: "Standard Claude Code, no additional conventions",
    injectMatcha: false,
  },
  {
    id: "terse",
    label: "Terse prompt",
    desc: "Claude Code instructed to be brief — no structural rules",
    injectMatcha: false,
  },
  {
    id: "matcha",
    label: "matcha rules",
    desc: "Claude Code with full matcha engineering conventions injected",
    injectMatcha: true,
  },
];

// ─── Task discovery ────────────────────────────────────────────────────────

function discoverTasks() {
  const dirs = readdirSync(TASKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  return dirs.map((id) => {
    const spec = readFileSync(join(TASKS_DIR, id, "spec.md"), "utf-8");
    const testPath = join(TASKS_DIR, id, "test.js");
    return {
      id,
      name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      spec,
      testPath,
    };
  });
}

// ─── Claude Code availability check ────────────────────────────────────────

function checkClaude() {
  try {
    execSync("which claude 2>/dev/null || where claude 2>nul", {
      stdio: "pipe",
      timeout: 5000,
      encoding: "utf-8",
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Tools ─────────────────────────────────────────────────────────────────

function countLOC(code) {
  return code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//"))
    .length;
}

function estimateTokens(code) {
  return Math.ceil(code.length / 4);
}

// ─── Extract JS code from Claude stdout ───────────────────────────────────

/**
 * Claude often wraps output in narration + ```js fences, or plain narration.
 * Strategy:
 *   1. If fenced code block exists → extract content inside first ```...```
 *   2. Otherwise → strip leading/trailing prose lines, keep JS lines
 */
function stripFences(text) {
  text = text.trim();

  // Strategy 1: extract content from first fenced block
  const fenceMatch = text.match(
    /```(?:js|javascript)?\r?\n?([\s\S]*?)\r?\n?```/i,
  );
  if (fenceMatch) return fenceMatch[1].trim();

  // Strategy 2: strip leading/trailing prose lines, keep JS lines
  const lines = text.split("\n");
  const isCodeLine = (l) => {
    const t = l.trim();
    if (!t) return true; // blank lines ok inside code
    // Prose heuristic: starts with capital + no JS keywords/punctuation → narration
    if (
      /^[A-Z][a-z]/.test(t) &&
      !/^(const|let|var|function|class|import|export|module|return|if|for|while|\/\/)/.test(
        t,
      ) &&
      !/[=({;]/.test(t)
    )
      return false;
    return true;
  };

  let start = 0;
  let end = lines.length - 1;
  while (start < lines.length && !isCodeLine(lines[start])) start++;
  while (end > start && !isCodeLine(lines[end])) end--;

  return lines
    .slice(start, end + 1)
    .join("\n")
    .trim();
}

// ─── Matcha injection ──────────────────────────────────────────────────────

/**
 * Injects matcha conventions into a project directory by creating
 * a .claude/CLAUDE.md with core matcha rules. This is how Claude Code
 * natively picks up conventions — no plugin or hook needed.
 */
function injectMatcha(dir) {
  const claudeDir = join(dir, ".claude");
  mkdirSync(claudeDir, { recursive: true });

  const claudeMd = `# 🍵 matcha — Engineering Convention

Simple. Efficient. Deliberate. Never twice.

## Core Rules
- One function = one thing. No monolithic functions.
- No hardcoded values. Use named constants (APPNAME_VAR_NAME).
- Explicit error messages. Don't silently swallow errors.
- Prefer const over let, arrow functions, concise expressions.
- Remove temp/debug code before finishing.
- No unnecessary abstractions. Don't build what you don't need.

## Before Writing
1. **Purpose**: What am I solving? Why?
2. **Simplicity**: Is there a simpler path? Fewer functions? Fewer lines?
3. **Reuse**: Can I use an existing approach instead of inventing a new one?

## Intensity: enforce
`;

  writeFileSync(join(claudeDir, "CLAUDE.md"), claudeMd, "utf-8");
}

// ─── Per-task runner ───────────────────────────────────────────────────────

/**
 * Runs a single task × arm combination.
 * 1. Creates a temp directory
 * 2. Writes the spec as a prompt file
 * 3. Optionally injects matcha rules
 * 4. Spawns Claude Code with the spec
 * 5. Strips markdown fences from stdout and writes to solution.js
 * 6. Runs the test harness
 * 7. Reports results
 */
async function runTask(taskId, taskName, spec, testPath, arm, options = {}) {
  const { simulate = false, keep = false, timeout = 120_000 } = options;
  const tmpDir = mkdtempSync(
    join(__dirname, ".tmp-" + taskId + "-" + arm.id + "-"),
  );
  const specFile = join(tmpDir, "prompt.md");
  const solutionFile = join(tmpDir, "solution.js");

  const result = {
    task: taskId,
    taskName,
    arm: arm.id,
    armLabel: arm.label,
    loc: 0,
    tokens: 0,
    correct: false,
    error: null,
    code: "",
    tmpDir,
  };

  try {
    // Write package.json to override parent's "type": "module"
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ type: "commonjs" }),
      "utf-8",
    );

    // Build prompt — terse arm gets brevity hint, all arms get code-only instruction
    let fullSpec =
      arm.id === "terse"
        ? `${spec}\n\nIMPORTANT: Be brief. Write minimal working code. No comments. No explanations. Short variable names OK.`
        : spec;

    // Critical: tell Claude to output raw JS only — no markdown, no narration
    fullSpec +=
      "\n\nCRITICAL: Respond with ONLY raw JavaScript code. No markdown fences, no backticks, no explanation, no file creation commands. Just the code.";

    writeFileSync(specFile, fullSpec, "utf-8");

    // Inject matcha rules for matcha arm
    if (arm.injectMatcha) {
      injectMatcha(tmpDir);
    }

    // Spawn Claude Code or simulate
    if (simulate) {
      // Simulated mode: write a basic solution to pass tests
      writeFileSync(solutionFile, getDefaultSolution(taskId, arm.id), "utf-8");
    } else {
      // Real Claude Code invocation — pass prompt as arg so Claude outputs to stdout
      const claudeArgs = ["--print", fullSpec];
      const child = spawn("claude", claudeArgs, {
        cwd: tmpDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          child.kill("SIGTERM");
          reject(new Error(`Timeout after ${timeout / 1000}s`));
        }, timeout);

        child.on("close", (code) => {
          clearTimeout(timer);
          resolve(code);
        });
        child.on("error", reject);
      });

      // Strip markdown fences and write to solution.js
      // Claude wraps output in ```js ... ``` even when instructed not to
      if (stdout.trim()) {
        const code = stripFences(stdout);
        writeFileSync(solutionFile, code, "utf-8");
      }
    }

    // Check if solution.js was generated
    if (!existsSync(solutionFile)) {
      throw new Error("solution.js not generated — Claude produced no stdout");
    }

    // Read generated code
    const code = readFileSync(solutionFile, "utf-8");
    result.code = code;
    result.loc = countLOC(code);
    result.tokens = estimateTokens(code);

    // Run test harness
    if (existsSync(testPath)) {
      try {
        const testInTmp = join(tmpDir, "_test.cjs");
        writeFileSync(testInTmp, readFileSync(testPath, "utf-8"), "utf-8");

        const testOutput = execSync(`node "${testInTmp}"`, {
          cwd: tmpDir,
          timeout: 15_000,
          encoding: "utf-8",
          stdio: "pipe",
        });
        result.correct = !testOutput.includes("FAIL");
        result.testOutput = testOutput.trim();
      } catch (e) {
        result.correct = false;
        result.error = e.message;
        result.testOutput = e.stdout || "";
      }
    } else {
      // No test file = assume correct
      result.correct = true;
    }

    // Adversarial gate — edge case robustness (injection, boundary)
    result.adversarial = runAdversarialTest(taskId, result.code);
  } catch (e) {
    result.error = e.message;
    result.correct = false;
  }

  // Cleanup unless --keep
  if (!keep) {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }

  return result;
}

// ─── Adversarial gate ──────────────────────────────────────────────────────

/**
 * Runs adversarial tests against generated code.
 * Tests injection patterns (XSS, path traversal, SQLi) and boundary values.
 * Returns true if ALL adversarial checks pass.
 */
function runAdversarialTest(taskId, code) {
  if (!code || !code.trim()) return false;

  try {
    switch (taskId) {
      case "email-validator": {
        const fn = new Function(
          `"use strict"; ${code.replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "").trim()}; return isValidEmail;`,
        )();
        if (fn(null) !== false || fn(undefined) !== false) return false;
        if (fn("<script>alert(1)</script>@x.com") !== false) return false;
        if (fn('"' + "><script>alert(1)<" + "/script>@x.com") !== false)
          return false;
        if (fn("a".repeat(320) + "@b.com") !== false) return false;
        return true;
      }
      case "csv-sum": {
        const fn = new Function(
          `"use strict"; ${code.replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "").trim()}; return sumColumn;`,
        )();
        if (fn("", 0) !== 0) return false;
        if (fn("a,b\n../../../etc/passwd,2", 1) !== 2) return false;
        if (fn("a,b\nNaN,1", 1) !== 1) return false;
        if (fn("a,b\n1,2", 5) !== 0) return false;
        return true;
      }
      case "fizzbuzz": {
        const fn = new Function(
          `"use strict"; ${code.replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "").trim()}; return fizzBuzz;`,
        )();
        if (!Array.isArray(fn(0)) || fn(0).length !== 0) return false;
        if (!Array.isArray(fn(NaN))) return false;
        const large = fn(10000);
        if (!Array.isArray(large) || large.length !== 10000) return false;
        return true;
      }
      case "array-flatten": {
        const fn = new Function(
          `"use strict"; ${code.replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "").trim()}; return flatten;`,
        )();
        if (!Array.isArray(fn(null))) return false;
        if (!Array.isArray(fn(undefined))) return false;
        const deep = [1];
        let ref = deep;
        for (let i = 0; i < 100; i++) {
          ref.push([i]);
          ref = ref[1];
        }
        if (!Array.isArray(fn(deep)) || fn(deep).length < 50) return false;
        return true;
      }
      case "date-fmt": {
        const fn = new Function(
          `"use strict"; ${code.replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "").trim()}; return formatDate;`,
        )();
        try {
          fn(null, "YYYY-MM-DD");
        } catch {
          return false;
        }
        if (fn(new Date("2024-02-29"), "YYYY-MM-DD") !== "2024-02-29")
          return false;
        return true;
      }
      case "log-filter": {
        const fn = new Function(
          `"use strict"; ${code.replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "").trim()}; return filterLogs;`,
        )();
        if (!Array.isArray(fn(null, "INFO"))) return false;
        if (!Array.isArray(fn(undefined, "WARN"))) return false;
        if (fn([{ level: "INFO", msg: "x" }], "TRACE").length !== 0)
          return false;
        return true;
      }
      case "palindrome-checker": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return isPalindrome;",
        )();
        if (fn(null) !== false || fn(undefined) !== false) return false;
        if (fn("<script>alert(1)</script>") !== false) return false;
        if (fn(123) !== false) return false;
        return true;
      }
      case "anagram-group": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return anagramGroups;",
        )();
        if (!Array.isArray(fn(null))) return false;
        if (!Array.isArray(fn(undefined))) return false;
        if (!Array.isArray(fn([]))) return false;
        const result = fn(["a", "b", "a"]);
        if (!Array.isArray(result)) return false;
        return true;
      }
      case "deep-merge": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return deepMerge;",
        )();
        const r = fn(null, { a: 1 });
        if (!r || r.a !== 1) return false;
        const r2 = fn({ a: 1 }, null);
        if (!r2 || r2.a !== 1) return false;
        return true;
      }
      case "retry-async": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return retry;",
        )();
        fn("not a function").catch(() => {});
        return true;
      }
      case "throttle": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return throttle;",
        )();
        const noop = fn("not a function", 100);
        if (typeof noop !== "function") return false;
        noop();
        return true;
      }
      case "deep-clone": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return deepClone;",
        )();
        if (fn(null) !== null) return false;
        if (fn(42) !== 42) return false;
        const d = new Date();
        if (fn(d).getTime() !== d.getTime()) return false;
        return true;
      }
      case "semver-compare": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return semverCompare;",
        )();
        if (typeof fn("0.0.0", "0.0.0") !== "number") return false;
        return true;
      }
      case "config-parser": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return parseConfig;",
        )();
        if (JSON.stringify(fn(null)) !== "{}") return false;
        if (JSON.stringify(fn("")) !== "{}") return false;
        return true;
      }
      case "memoize": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return memoize;",
        )();
        const n = fn("not a function");
        n();
        let count = 0;
        const d = fn((x) => {
          count++;
          return x * 2;
        });
        d(5);
        d(5);
        if (count !== 1) return false;
        return true;
      }
      case "chunk-array": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return chunk;",
        )();
        if (!Array.isArray(fn(null, 2))) return false;
        if (!Array.isArray(fn([], 2))) return false;
        if (fn([1], 0).length !== 0) return false;
        if (fn([1, 2, 3], 2).length !== 2) return false;
        return true;
      }
      case "unique-filter": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return unique;",
        )();
        if (!Array.isArray(fn(null))) return false;
        if (!Array.isArray(fn([]))) return false;
        const r = fn([1, 2, 2, 3]);
        if (r.length !== 3) return false;
        return true;
      }
      case "deep-get": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return deepGet;",
        )();
        if (fn(null, "a") !== undefined) return false;
        if (fn({}, "") === undefined) return false;
        return true;
      }
      case "pipe-compose": {
        const fn = new Function(
          "use strict",
          code
            .replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?\s*$/gm, "")
            .trim() + "; return pipe;",
        )();
        const id = fn();
        if (id(42) !== 42) return false;
        try {
          fn("not a function");
          return false;
        } catch {
          return true;
        }
      }
      default:
        return true;
    }
  } catch {
    return false;
  }
}

// ─── Default solutions for simulate mode ───────────────────────────────────

function getDefaultSolution(taskId, armId) {
  const solutions = {
    "email-validator": {
      baseline: `const EMAIL_RE = /^[\\w.%+-]+@[\\w.-]+\\.[a-z]{2,}$/i;
function isValidEmail(email) {
  if (typeof email !== "string") return false;
  return EMAIL_RE.test(email);
}
module.exports = { isValidEmail };`,
      terse: `const R=/^[\\w.%+-]+@[\\w.-]+\\.[a-z]{2,}$/i;
function isValidEmail(e){return typeof e=="string"?R.test(e):false}
module.exports={isValidEmail};`,
      matcha: `const EMAIL_RE = /^[\\w.%+-]+@[\\w.-]+\\.[a-z]{2,}$/i;
const isValidEmail = (email) => typeof email === "string" && EMAIL_RE.test(email);
module.exports = { isValidEmail };`,
    },
    debounce: {
      baseline: `function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
module.exports = { debounce };`,
      terse: `function debounce(f,t){let a;return function(...r){clearTimeout(a);a=setTimeout(()=>f(...r),t)}}
module.exports={debounce};`,
      matcha: `const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};
module.exports = { debounce };`,
    },
    "csv-sum": {
      baseline: `function sumColumn(csv, colIndex) {
  if (!csv || !csv.trim()) return 0;
  const lines = csv.trim().split("\\n");
  let sum = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    sum += parseFloat(cols[colIndex]) || 0;
  }
  return sum;
}
module.exports = { sumColumn };`,
      terse: `function sumColumn(c,i){if(!c)return 0;return c.trim().split("\\n").slice(1).reduce((s,r)=>s+(+r.split(",")[i]||0),0)}
module.exports={sumColumn};`,
      matcha: `const sumColumn = (csv, i) =>
  csv?.trim() ? csv.trim().split("\\n").slice(1)
    .reduce((s, row) => s + (+row.split(",")[i] || 0), 0) : 0;
module.exports = { sumColumn };`,
    },
    fizzbuzz: {
      baseline: `function fizzBuzz(n) {
  const result = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) result.push("FizzBuzz");
    else if (i % 3 === 0) result.push("Fizz");
    else if (i % 5 === 0) result.push("Buzz");
    else result.push(i);
  }
  return result;
}
module.exports = { fizzBuzz };`,
      terse: `function fizzBuzz(n){const a=[];for(let i=1;i<=n;i++)a.push(i%15==0?"FizzBuzz":i%3==0?"Fizz":i%5==0?"Buzz":i);return a}
module.exports={fizzBuzz};`,
      matcha: `const fizzBuzz = (n) =>
  Array.from({ length: n }, (_, i) => {
    const v = i + 1;
    return (v % 3 ? "" : "Fizz") + (v % 5 ? "" : "Buzz") || v;
  });
module.exports = { fizzBuzz };`,
    },
    "array-flatten": {
      baseline: `function flatten(arr) {
  if (!arr) return [];
  return arr.reduce((acc, v) =>
    acc.concat(Array.isArray(v) ? flatten(v) : v), []);
}
module.exports = { flatten };`,
      terse: `function flatten(a){return a?a.reduce((r,v)=>r.concat(Array.isArray(v)?flatten(v):v),[]):[]}
module.exports={flatten};`,
      matcha: `const flatten = (arr) =>
  Array.isArray(arr) ? arr.reduce(
    (acc, v) => acc.concat(Array.isArray(v) ? flatten(v) : v), []
  ) : [];
module.exports = { flatten };`,
    },
    "date-fmt": {
      baseline: `function formatDate(date, fmt) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  if (fmt === "YYYY-MM-DD") return y + "-" + m + "-" + d;
  if (fmt === "DD/MM/YYYY") return d + "/" + m + "/" + y;
  return "";
}
module.exports = { formatDate };`,
      terse: `function formatDate(d,f){if(!d)return "";const y=d.getFullYear(),m=("0"+(d.getMonth()+1)).slice(-2),da=("0"+d.getDate()).slice(-2);return f=="YYYY-MM-DD"?y+"-"+m+"-"+da:da+"/"+m+"/"+y}
module.exports={formatDate};`,
      matcha: `const PAD = (n) => String(n).padStart(2, "0");
const FMTS = {
  "YYYY-MM-DD": (d) => [d.getFullYear(), PAD(d.getMonth() + 1), PAD(d.getDate())].join("-"),
  "DD/MM/YYYY": (d) => [PAD(d.getDate()), PAD(d.getMonth() + 1), d.getFullYear()].join("/"),
};
const formatDate = (d, f) => FMTS[f]?.(d) ?? "";
module.exports = { formatDate };`,
    },
    "log-filter": {
      baseline: `const LVL = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
function filterLogs(logs, minLevel) {
  if (!logs) return [];
  const min = LVL[minLevel];
  if (min === undefined) return [];
  return logs.filter(log => (LVL[log.level] ?? -1) >= min);
}
module.exports = { filterLogs };`,
      terse: `const L={DEBUG:0,INFO:1,WARN:2,ERROR:3};
function filterLogs(l,m){if(!l)return[];const n=L[m];return n===undefined?[]:l.filter(x=>(L[x.level]??-1)>=n)}
module.exports={filterLogs};`,
      matcha: `const LVL = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const filterLogs = (logs, min) =>
  logs?.filter?.((l) => (LVL[l.level] ?? -1) >= (LVL[min] ?? -1)) ?? [];
module.exports = { filterLogs };`,
    },
  };

  return (
    solutions[taskId]?.[armId] ??
    `// No default solution for ${taskId}/${armId}\nmodule.exports = {};`
  );
}

// ─── Main orchestrator ────────────────────────────────────────────────────

async function runAgenticLive(options = {}) {
  const {
    arms = ARMS.map((a) => a.id),
    tasks = null,
    simulate = false,
    keep = false,
    timeout = 120_000,
    iterations = 1,
  } = options;

  const armList = arms ?? ARMS.map((a) => a.id);
  const selectedArms = ARMS.filter((a) => armList.includes(a.id));
  const allTasks = discoverTasks();
  const selectedTasks = tasks
    ? allTasks.filter((t) => tasks.includes(t.id))
    : allTasks;

  const claudeAvailable = simulate ? false : checkClaude();

  console.log(`🍵 matcha: Agentic Live Benchmark`);
  console.log(
    `Mode: ${simulate ? "SIMULATED" : claudeAvailable ? "LIVE (Claude Code detected)" : "FALLBACK (no Claude, using simulate)"}`,
  );
  console.log(
    `${selectedTasks.length} tasks × ${selectedArms.length} arms × ${iterations} iterations\n`,
  );

  if (iterations > 1 && simulate) {
    console.log(
      `  📊 n=${iterations} — simulated mode (deterministic, same result per run)`,
    );
    console.log(
      `  📊 For non-deterministic results, run live with Claude Code installed\n`,
    );
  }

  if (!simulate && !claudeAvailable) {
    console.log(
      "⚠️  Claude Code CLI not found. Falling back to simulated mode.\n",
    );
    console.log(
      "   Install Claude Code: https://docs.anthropic.com/en/docs/claude-code/overview\n",
    );
  }

  const results = [];

  for (const task of selectedTasks) {
    for (const arm of selectedArms) {
      const cells = [];
      for (let i = 0; i < iterations; i++) {
        process.stdout.write(
          `  ▶ ${task.name} × ${arm.label} (iter ${i + 1}/${iterations})... `,
        );

        const result = await runTask(
          task.id,
          task.name,
          task.spec,
          task.testPath,
          arm,
          { simulate: simulate || !claudeAvailable, keep, timeout },
        );

        const icon = result.correct ? "✅" : "❌";
        process.stdout.write(`${icon} ${result.loc} LOC\n`);
        cells.push(result);
      }

      if (iterations > 1) {
        const locs = cells.map((c) => c.loc);
        const toks = cells.map((c) => c.tokens);
        const medianLoc = locs.sort((a, b) => a - b)[
          Math.floor(locs.length / 2)
        ];
        const medianTok = toks.sort((a, b) => a - b)[
          Math.floor(toks.length / 2)
        ];
        const correct =
          cells.filter((c) => c.correct).length > cells.length / 2;
        const adversarial =
          cells.filter((c) => c.adversarial).length > cells.length / 2;

        results.push({
          task: task.id,
          taskName: task.name,
          arm: arm.id,
          armLabel: arm.label,
          loc: medianLoc,
          tokens: medianTok,
          correct,
          adversarial,
          error: cells.find((c) => c.error)?.error || null,
          code: cells[0]?.code || "",
          n: iterations,
          runs: cells.map((c) => ({
            loc: c.loc,
            correct: c.correct,
            adversarial: c.adversarial,
          })),
        });
      } else {
        results.push(cells[0]);
      }
    }
  }

  console.log(formatLiveReport(results, selectedArms));
  return results;
}

// ─── Report formatting ────────────────────────────────────────────────────

function formatLiveReport(results, arms) {
  const groups = {};
  for (const r of results) {
    if (!groups[r.task]) groups[r.task] = {};
    groups[r.task][r.arm] = r;
  }

  const armKeys = arms.map((a) => a.id);
  const taskIds = [...new Set(results.map((r) => r.task))];

  let output = "\n═══ Results ═══\n";

  const totals = {};
  for (const a of armKeys) {
    totals[a] = { loc: 0, correct: 0, adversarial: 0, total: 0, errors: 0 };
  }

  for (const taskId of taskIds) {
    output += `\n── ${groups[taskId][armKeys[0]]?.taskName ?? taskId} ──\n`;

    for (const a of armKeys) {
      const r = groups[taskId]?.[a];
      if (!r) continue;

      const icon = r.correct ? "✅" : r.error ? "⚠️" : "❌";
      output += `  ${icon} ${a.padEnd(10)} ${String(r.loc).padStart(3)} LOC, ~${String(r.tokens).padStart(3)} tok`;
      if (r.error) output += `  ${r.error.slice(0, 60)}`;
      output += "\n";

      totals[a].loc += r.loc;
      if (r.correct) totals[a].correct++;
      if (r.adversarial) totals[a].adversarial++;
      totals[a].total++;
      if (r.error) totals[a].errors++;
    }
  }

  output += "\n═══ Summary ═══\n";
  const header = armKeys.map((a) => a.padStart(10)).join("  ");
  output += `${"".padEnd(14)}${header}\n`;

  const locRow = armKeys
    .map((a) => String(totals[a].loc).padStart(10))
    .join("  ");
  output += `${"Total LOC:".padEnd(14)}${locRow}\n`;

  const correctRow = armKeys
    .map((a) => `${totals[a].correct}/${totals[a].total}`.padStart(10))
    .join("  ");
  output += `${"Correct:".padEnd(14)}${correctRow}\n`;

  const advRow = armKeys
    .map((a) => `${totals[a].adversarial}/${totals[a].total}`.padStart(10))
    .join("  ");
  output += `${"Adversarial:".padEnd(14)}${advRow}\n`;

  const b = totals["baseline"];
  if (b && b.loc > 0) {
    for (const a of armKeys) {
      if (a === "baseline") continue;
      const delta = b.loc - totals[a].loc;
      const pct = Math.round((delta / b.loc) * 100);
      output += `\n  📐 ${a} vs baseline: ${delta >= 0 ? "-" : "+"}${Math.abs(delta)} LOC (${delta >= 0 ? "-" : ""}${Math.abs(pct)}%)`;
    }

    const m = totals["matcha"];
    const t = totals["terse"];
    if (m && t) {
      if (t.loc > m.loc) {
        output += `\n  🎯 matcha beats terse by ${t.loc - m.loc} LOC — rules > mere brevity`;
      } else if (m.loc > t.loc) {
        output += `\n  ⚠️  terse beats matcha by ${m.loc - t.loc} LOC`;
      } else {
        output += `\n  ➖ matcha ≈ terse — same LOC`;
      }
    }
  }

  output += "\n";
  return output;
}

// ─── CLI entry ────────────────────────────────────────────────────────────

const isDirectInvocation =
  process.argv[1] &&
  (process.argv[1].replace(/\\/g, "/").endsWith("agentic-runner.js") ||
    process.argv[1].replace(/\\/g, "/").endsWith("agentic-runner"));

if (isDirectInvocation) {
  (async () => {
    const args = process.argv.slice(2);
    const armFilter = args.includes("--arm")
      ? args[args.indexOf("--arm") + 1]?.split(",")
      : null;
    const taskFilter = args.includes("--task")
      ? args[args.indexOf("--task") + 1]?.split(",")
      : null;
    const keep = args.includes("--keep");
    const simulate = args.includes("--simulate");
    const jsonFlag = args.includes("--json");
    const itersIndex = args.indexOf("--iters");
    const iterations =
      itersIndex >= 0 ? parseInt(args[itersIndex + 1], 10) || 4 : 1;

    const results = await runAgenticLive({
      arms: armFilter,
      tasks: taskFilter,
      simulate,
      keep,
      iterations,
    });

    if (jsonFlag) {
      console.log(JSON.stringify(results, null, 2));
    }
  })();
}

export { runAgenticLive, discoverTasks, ARMS };
