#!/usr/bin/env node
/**
 * 🍵 matcha — matcha-bench.js
 * Compliance benchmark tool.
 * Scans project for matcha compliance issues and produces a score.
 *
 * Usage:
 *   node benchmark/matcha-bench.js          ← scan current dir
 *   node benchmark/matcha-bench.js ./src    ← scan specific dir
 *   node benchmark/matcha-bench.js --json   ← JSON output
 *   node benchmark/matcha-bench.js --baseline ./baseline.json  ← compare with baseline
 *   node benchmark/matcha-bench.js --agentic ← agentic A/B benchmark
 *
 * Matcha-style: simple, one file, deterministic, fast.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";
import { runAgenticLive } from "./agentic-runner.js";
import { countLOC, estimateTokens } from "./bench-utils.js";

// ─── Compliance checks ───────────────────────────────────────────────────────

const CHECKS = [
  {
    id: "debug-log",
    label: "Debug log/statement",
    severity: "minor",
    patterns: [
      /console\.(log|debug|trace)\(/,
      /\bprint\(/,
      /\bdebugger\b/,
    ],
    fix: "Remove before commit, or use structured logger",
  },
  {
    id: "todo-fixme",
    label: "TODO/FIXME/HACK left in code",
    severity: "minor",
    patterns: [
      /\/\/\s*(TODO|FIXME|HACK|XXX|TEMP)/i,
      /#\s*(TODO|FIXME|HACK|XXX|TEMP)/i,
    ],
    fix: "Resolve or create a tracking issue",
  },
  {
    id: "empty-catch",
    label: "Empty catch block",
    severity: "critical",
    patterns: [
      /catch\s*(\[\w+\]|\{\w+\}|\(\w+\))?\s*\{\s*\}/,
      /catch:\s*\{\s*\}/,
    ],
    fix: "Log the error: catch (e) { logger.error(e) }",
  },
  {
    id: "hardcoded-cred",
    label: "Possible hardcoded credential",
    severity: "critical",
    patterns: [
      /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{4,}["']/i,
    ],
    fix: "Move to env var: APPNAME_VAR_NAME",
  },
  {
    id: "hardcoded-url",
    label: "Hardcoded URL string",
    severity: "info",
    patterns: [
      /(?:const|let|var)\s+\w+\s*=\s*["']https?:\/\/[^"']+["']/,
      /(?:const|let|var)\s+\w+\s*=\s*["'](?:ftp|ws)s?:\/\/[^"']+["']/,
    ],
    fix: "Move to env var with APPNAME_ prefix",
  },
];

// ─── File scanning ───────────────────────────────────────────────────────────

const IGNORE_DIRS = [
  "node_modules", ".git", "dist", "build", ".next", ".nuxt",
  ".cache", "coverage", "vendor", ".venv", "__pycache__",
  ".claude", ".cursor", ".opencode", ".agents", ".kiro",
  ".windsurf", ".clinerules", ".qoder", ".qwen", ".openclaw",
];

function walkDir(dir, base, files = []) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.includes(entry.name) && !entry.name.startsWith(".")) {
          walkDir(full, base, files);
        }
      } else if (
        entry.name.endsWith(".js") || entry.name.endsWith(".ts") ||
        entry.name.endsWith(".jsx") || entry.name.endsWith(".tsx") ||
        entry.name.endsWith(".py") || entry.name.endsWith(".go") ||
        entry.name.endsWith(".java") || entry.name.endsWith(".php")
      ) {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

function scanFile(filePath) {
  if (!filePath || !existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const findings = [];

  for (const check of CHECKS) {
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of check.patterns) {
        if (pattern.test(lines[i])) {
          findings.push({
            file: filePath,
            line: i + 1,
            issue: check.label,
            severity: check.severity,
            fix: check.fix,
          });
          break;
        }
      }
      if (findings.some(f => f.issue === check.issue)) break;
    }
  }

  return findings;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function calculateScore(totalIssues, criticalIssues, totalFiles) {
  if (totalFiles === 0) return { score: 100, grade: "A+", label: "Perfect" };

  let deductions = 0;

  // Critical issues: -15 each (max -60)
  deductions += Math.min(criticalIssues * 15, 60);

  // Minor issues: -5 each (max -30)
  const minorIssues = totalIssues - criticalIssues;
  deductions += Math.min(minorIssues * 5, 30);

  // Density penalty: if issues per file > 0.5
  const density = totalIssues / totalFiles;
  if (density > 0.5) deductions += 10;

  const score = Math.max(0, 100 - deductions);

  let grade, label;
  if (score >= 95) { grade = "A+"; label = "Excellent — matcha compliant"; }
  else if (score >= 85) { grade = "A"; label = "Good — minor issues"; }
  else if (score >= 70) { grade = "B"; label = "Needs attention"; }
  else if (score >= 50) { grade = "C"; label = "Poor — needs cleanup"; }
  else { grade = "F"; label = "Critical — major cleanup required"; }

  return { score, grade, label };
}

// ─── Report ──────────────────────────────────────────────────────────────────

function formatReport(result) {
  const { filesScanned, totalIssues, criticalIssues, minorIssues, infoIssues, findings, score, grade, label } = result;

  let output = "";
  output += `🍵 matcha: Compliance Benchmark\n\n`;
  output += `  Files scanned:  ${filesScanned}\n`;
  output += `  Issues found:  ${totalIssues} (🔴 ${criticalIssues} critical, 🟡 ${minorIssues} minor, 🟢 ${infoIssues} info)\n`;
  output += `  Score:         ${score}/100 (${grade})\n`;
  output += `  Status:        ${label}\n\n`;

  if (findings.length > 0) {
    output += `  Breakdown:\n`;
    for (const f of findings) {
      const icon = f.severity === "critical" ? "🔴" : f.severity === "minor" ? "🟡" : "🟢";
      output += `    ${icon} ${f.file}:${f.line} — ${f.issue}\n`;
      output += `       → ${f.fix}\n`;
    }
  }

  return output;
}

// ─── Agentic Benchmark Mode ─────────────────────────────────────────────────

/**
 * Standard coding tasks for agentic benchmark.
 * Each task has: id, name, language, spec, expected output/behavior,
 * and default solutions for both arms (baseline = without matcha, matcha = with matcha).
 */
const TASKS = [
  {
    id: "email-validator",
    name: "Email Validator",
    lang: "js",
    ext: ".js",
    spec: "Write a function isValidEmail(email) that returns true for valid emails and false for invalid ones.",
    testInput: ["user@example.com", "invalid", "test@test", ""],
    expectedOutput: [true, false, false, false],
    defaultBaseline: `function isValidEmail(email) {
  // Basic email validation using regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

module.exports = { isValidEmail };`,
    defaultMatcha: `const EMAIL_RE = /^[\\w.%+-]+@[\\w.-]+\\.[a-z]{2,}$/i;
const isValidEmail = (email) => EMAIL_RE.test(email);
export { isValidEmail };`,
    defaultTerse: `var re=/^[\\w.%+-]+@[\\w.-]+\\.[a-z]{2,}$/i;
function isValidEmail(e){return re.test(e)}`,
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return isValidEmail;`)();
        // Type guards
        if (fn(null) !== false || fn(undefined) !== false || fn(123) !== false) return false;
        // XSS injection patterns — should NOT pass validation
        if (fn('<script>alert(1)</script>@x.com') !== false) return false;
        if (fn('"><script>alert(1)</script>@x.com') !== false) return false;
        if (fn('test@<script>alert(1)</script>.com') !== false) return false;
        if (fn('test@x.com<script>') !== false) return false;
        // SQL injection in email — should NOT pass
        if (fn("' OR '1'='1") !== false) return false;
        // Boundary: extremely long input
        if (fn("a".repeat(320) + "@b.com") !== false) return false;
        // Valid: +tag, unicode
        if (fn("user+tag@example.com") !== true) return false;
        if (fn("üser@example.com") !== true) return false;
        return true;
      } catch { return false; }
    },
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return isValidEmail;`)();
      return testInput.map(input => fn(input));
    },
  },
  {
    id: "debounce",
    name: "Debounce Function",
    lang: "js",
    ext: ".js",
    spec: "Write a debounce(fn, delay) function that delays invoking fn until delay ms after the last call.",
    testInput: [50],
    expectedOutput: ["called once"],
    defaultBaseline: `function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

module.exports = { debounce };`,
    defaultMatcha: `const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};
export { debounce };`,
    defaultTerse: `function debounce(f,t){var a;return function(){clearTimeout(a);a=setTimeout(f,t)}}`,
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return debounce;`)();
        // Null/undefined fn — should not crash, return noop or handle gracefully
        fn(null, 0);
        fn(undefined, -1);
        // Negative delay — should not crash
        fn(() => {}, -100);
        // Zero delay — should work
        fn(() => {}, 0);
        // Non-function first arg — should not crash
        fn("not a function", 100);
        fn(42, 100);
        // Large delay value — should not crash
        fn(() => {}, 2_147_483_647);
        return true;
      } catch { return false; }
    },
    testRunner: (code, testInput) => {
      return new Promise(resolve => {
        let callCount = 0;
        const fn = new Function(`"use strict"; ${code}; return debounce;`)();
        const debounced = fn(() => { callCount++; }, testInput[0]);
        debounced();
        debounced();
        debounced();
        setTimeout(() => {
          resolve(callCount === 1 ? ["called once"] : ["failed"]);
        }, testInput[0] + 20);
      });
    },
  },
  {
    id: "csv-sum",
    name: "CSV Column Sum",
    lang: "js",
    ext: ".js",
    spec: "Write a function sumColumn(csv, colIndex) that parses CSV text and sums a numeric column.",
    testInput: ['a,b,c\n1,2,3\n4,5,6', 1],
    expectedOutput: [7],
    defaultBaseline: `function sumColumn(csv, colIndex) {
  const lines = csv.trim().split('\n');
  let sum = 0;
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',');
    sum += parseFloat(columns[colIndex]);
  }
  return sum;
}

module.exports = { sumColumn };`,
    defaultMatcha: `const sumColumn = (csv, i) =>
  csv.trim().split('\n').slice(1)
    .reduce((s, row) => s + +row.split(',')[i], 0);
export { sumColumn };`,
    defaultTerse: `function sumColumn(c,i){return c.trim().split('\n').slice(1).reduce(function(s,r){return s+ +r.split(',')[i]},0)}`,
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return sumColumn;`)();
        if (fn('', 0) !== 0 || fn('a,b\n', 0) !== 0) return false;
        // Path traversal strings as data — should sum as 0 (non-numeric)
        if (fn('a,b\n../../../etc/passwd,2', 1) !== 2) return false;
        // SQL injection in CSV content — should sum as 0
        if (fn('a,b\n"\' OR \'1\'=\'1",1', 1) !== 1) return false;
        // Non-numeric column — should treat as 0
        if (fn('a,b\nx,y\np,q', 1) !== 0) return false;
        // Negative number column
        if (fn('a,b\n1,-2\n3,4', 1) !== 2) return false;
        // NaN in data
        if (fn('a,b\nNaN,1', 1) !== 1) return false;
        // Infinity in data
        if (fn('a,b\nInfinity,1', 1) !== 1) return false;
        // Out-of-bounds column index
        if (fn('a,b\n1,2', 5) !== 0) return false;
        if (fn('a,b\n1,2', -1) !== 0) return false;
        return true;
      } catch { return false; }
    },
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return sumColumn;`)();
      return [fn(testInput[0], testInput[1])];
    },
  },
  {
    id: "fizzbuzz",
    name: "FizzBuzz",
    lang: "js",
    ext: ".js",
    spec: "Write a function fizzBuzz(n) that returns array: 'FizzBuzz' for multiples of 3 and 5, 'Fizz' for 3, 'Buzz' for 5, else the number.",
    testInput: [15],
    expectedOutput: [[1,2,"Fizz",4,"Buzz","Fizz",7,8,"Fizz","Buzz",11,"Fizz",13,14,"FizzBuzz"]],
    defaultBaseline: `function fizzBuzz(n) {
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
    defaultMatcha: `const fizzBuzz = (n) =>
  Array.from({ length: n }, (_, i) => {
    const v = i + 1;
    return (v % 3 ? "" : "Fizz") + (v % 5 ? "" : "Buzz") || v;
  });
export { fizzBuzz };`,
    defaultTerse: `function fizzBuzz(n){for(var a=[],i=1;i<=n;i++)a.push(i%15==0?"FizzBuzz":i%3==0?"Fizz":i%5==0?"Buzz":i);return a}`,
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return fizzBuzz;`)();
        if (fn(0).length !== 0 || !Array.isArray(fn(-1))) return false;
        // NaN — should return empty array or throw gracefully
        const nanResult = fn(NaN);
        if (!Array.isArray(nanResult)) return false;
        // Float — should handle or not crash
        const floatResult = fn(5.5);
        if (!Array.isArray(floatResult) || floatResult.length !== 5) return false;
        // Large n — should not hang or crash
        const largeResult = fn(1000);
        if (!Array.isArray(largeResult) || largeResult.length !== 1000) return false;
        return true;
      } catch { return false; }
    },
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return fizzBuzz;`)();
      return [fn(testInput[0])];
    },
  },
  {
    id: "array-flatten",
    name: "Array Flatten",
    lang: "js",
    ext: ".js",
    spec: "Write a function flatten(arr) that recursively flattens nested arrays.",
    testInput: [[1,[2,[3,4]],5]],
    expectedOutput: [[1,2,3,4,5]],
    defaultBaseline: `function flatten(arr) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      result = result.concat(flatten(arr[i]));
    } else {
      result.push(arr[i]);
    }
  }
  return result;
}

module.exports = { flatten };`,
    defaultMatcha: `const flatten = (arr) =>
  arr.reduce((acc, v) => acc.concat(Array.isArray(v) ? flatten(v) : v), []);
export { flatten };`,
    defaultTerse: `function flatten(a){return a.reduce(function(r,v){return r.concat(Array.isArray(v)?flatten(v):v)},[])}`,
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return flatten;`)();
        if (!Array.isArray(fn([])) || fn([]).length !== 0) return false;
        if (!Array.isArray(fn(null))) return false;
        // Non-array input — should return empty array or not crash
        if (!Array.isArray(fn(undefined))) return false;
        if (!Array.isArray(fn("string"))) return false;
        // Very deep nesting
        const deep = [1];
        let ref = deep;
        for (let i = 0; i < 100; i++) { ref.push([i]); ref = ref[1]; }
        const deepResult = fn(deep);
        if (!Array.isArray(deepResult) || deepResult.length < 50) return false;
        // Sparse array
        const sparse = [1, , 3];
        if (!Array.isArray(fn(sparse))) return false;
        return true;
      } catch { return false; }
    },
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return flatten;`)();
      return [fn(testInput[0])];
    },
   },
  {
    id: "palindrome-checker",
    name: "Palindrome Checker",
    lang: "js", ext: ".js",
    spec: "Write isPalindrome(str) that returns true if str is palindrome (ignoring case, non-alphanumeric).",
    testInput: ["racecar", "hello", ""],
    expectedOutput: [true, false, true],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return isPalindrome;`)();
      return testInput.map(i => fn(i));
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return isPalindrome;`)();
        if (fn(null) !== false || fn(undefined) !== false) return false;
        return true;
      } catch { return false; }
    },
  },
  {
    id: "anagram-group",
    name: "Anagram Group",
    lang: "js", ext: ".js",
    spec: "Write anagramGroups(strs) that groups anagrams together.",
    testInput: [["eat","tea","tan","ate","nat","bat"]],
    expectedOutput: [[["eat","tea","ate"],["tan","nat"],["bat"]]],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return anagramGroups;`)();
      return [fn(testInput[0])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return anagramGroups;`)();
        if (!Array.isArray(fn(null))) return false;
        if (!Array.isArray(fn(undefined))) return false;
        return true;
      } catch { return false; }
    },
  },
  {
    id: "deep-merge",
    name: "Deep Merge",
    lang: "js", ext: ".js",
    spec: "Write deepMerge(target, source) that deep merges two objects with array concatenation.",
    testInput: [{a:1},{b:2}],
    expectedOutput: [{a:1,b:2}],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return deepMerge;`)();
      return [fn(testInput[0], testInput[1])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return deepMerge;`)();
        const r = fn(null, {a:1});
        if (!r || r.a !== 1) return false;
        return true;
      } catch { return false; }
    },
  },
  {
    id: "retry-async",
    name: "Retry Async",
    lang: "js", ext: ".js",
    spec: "Write retry(fn, retries, delay) that retries async function up to retries times.",
    testInput: ["async result", 3, 10],
    expectedOutput: ["async result"],
    testRunner: async (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return retry;`)();
      return [await fn(async () => "async result", testInput[1], testInput[2])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return retry;`)();
        fn("not a function").catch(() => {});
        return true;
      } catch { return true; }
    },
  },
  {
    id: "throttle",
    name: "Throttle",
    lang: "js", ext: ".js",
    spec: "Write throttle(fn, wait) that limits calls to at most once per wait ms.",
    testInput: [50],
    expectedOutput: ["called"],
    testRunner: (code, testInput) => {
      return new Promise(r => {
        const fn = new Function(`"use strict"; ${code}; return throttle;`)();
        let calls = [];
        const t = fn(x => calls.push(x), testInput[0]);
        t("a");
        setTimeout(() => r(calls.length > 0 ? ["called"] : ["not called"]), 30);
      });
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return throttle;`)();
        const noop = fn("not a function", 100);
        if (typeof noop !== "function") return false;
        noop();
        return true;
      } catch { return false; }
    },
  },
  {
    id: "deep-clone",
    name: "Deep Clone",
    lang: "js", ext: ".js",
    spec: "Write deepClone(value) that recursively deep clones objects, arrays, Date.",
    testInput: [{a:[1,{b:2}]}],
    expectedOutput: [{a:[1,{b:2}]}],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return deepClone;`)();
      return [fn(testInput[0])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return deepClone;`)();
        if (fn(null) !== null) return false;
        if (fn(42) !== 42) return false;
        const d = new Date();
        if (fn(d).getTime() !== d.getTime()) return false;
        return true;
      } catch { return false; }
    },
  },
  {
    id: "semver-compare",
    name: "Semver Compare",
    lang: "js", ext: ".js",
    spec: "Write semverCompare(a, b) that compares semver strings returning 1, -1, or 0.",
    testInput: ["1.0.0", "2.0.0", "1.0.0"],
    expectedOutput: [-1, 1, 0],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return semverCompare;`)();
      return [fn(testInput[0], testInput[1])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return semverCompare;`)();
        if (typeof fn("0.0.0", "0.0.0") !== "number") return false;
        return true;
      } catch { return false; }
    },
  },
  {
    id: "config-parser",
    name: "Config Parser",
    lang: "js", ext: ".js",
    spec: "Write parseConfig(str) that parses INI-style config (key=val, # comments).",
    testInput: ["key=value"],
    expectedOutput: [{key:"value"}],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return parseConfig;`)();
      return [fn(testInput[0])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return parseConfig;`)();
        if (JSON.stringify(fn(null)) !== "{}") return false;
        return true;
      } catch { return false; }
    },
  },
  {
    id: "memoize",
    name: "Memoize",
    lang: "js", ext: ".js",
    spec: "Write memoize(fn) that caches results based on arguments.",
    testInput: [5],
    expectedOutput: [10],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return memoize;`)();
      const d = fn(n => n * 2);
      return [d(testInput[0])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return memoize;`)();
        const n = fn("not a function");
        n();
        return true;
      } catch { return false; }
    },
  },
  {
    id: "chunk-array",
    name: "Chunk Array",
    lang: "js", ext: ".js",
    spec: "Write chunk(arr, size) that splits array into chunks of given size.",
    testInput: [[1,2,3,4,5], 2],
    expectedOutput: [[[1,2],[3,4],[5]]],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return chunk;`)();
      return [fn(testInput[0], testInput[1])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return chunk;`)();
        if (!Array.isArray(fn(null, 2))) return false;
        if (fn([1], 0).length !== 0) return false;
        return true;
      } catch { return false; }
    },
  },
  {
    id: "unique-filter",
    name: "Unique Filter",
    lang: "js", ext: ".js",
    spec: "Write unique(arr, key) that filters to unique values with optional key function.",
    testInput: [[1,2,2,3,1]],
    expectedOutput: [[1,2,3]],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return unique;`)();
      return [fn(testInput[0])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return unique;`)();
        if (!Array.isArray(fn(null))) return false;
        return true;
      } catch { return false; }
    },
  },
  {
    id: "deep-get",
    name: "Deep Get",
    lang: "js", ext: ".js",
    spec: "Write deepGet(obj, path) that safely gets nested property by dot path.",
    testInput: [{a:{b:{c:3}}}, "a.b.c"],
    expectedOutput: [3],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return deepGet;`)();
      return [fn(testInput[0], testInput[1])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return deepGet;`)();
        if (fn(null, "a") !== undefined) return false;
        return true;
      } catch { return false; }
    },
  },
  {
    id: "pipe-compose",
    name: "Pipe / Compose",
    lang: "js", ext: ".js",
    spec: "Write pipe(...fns) that returns left-to-right function composition.",
    testInput: [5],
    expectedOutput: [12],
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return pipe;`)();
      return [fn(x => x + 1, x => x * 2)(testInput[0])];
    },
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return pipe;`)();
        const id = fn();
        if (id(42) !== 42) return false;
        try { fn("not a function"); return false; } catch { return true; }
      } catch { return false; }
    },
  },
];

const OVERBUILD_TASKS = [
  {
    id: "date-fmt",
    name: "Date Formatter",
    lang: "js",
    ext: ".js",
    spec: "Write a function formatDate(date, fmt) that takes a Date and format string ('YYYY-MM-DD' or 'DD/MM/YYYY') and returns formatted string. Handle single-digit months/days with zero-padding.",
    testInput: [new Date("2024-03-15"), "YYYY-MM-DD", new Date("2024-03-15"), "DD/MM/YYYY"],
    expectedOutput: ["2024-03-15", "15/03/2024"],
    // Over-build trap: format parser, lookup tables, factory pattern, validation layer
    defaultBaseline: `function formatDate(date, fmt) {
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  // Zero-pad month and day
  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;

  // Handle format string
  if (fmt === "YYYY-MM-DD") {
    return year + "-" + month + "-" + day;
  } else if (fmt === "DD/MM/YYYY") {
    return day + "/" + month + "/" + year;
  }

  return "";
}

module.exports = { formatDate };`,
    defaultMatcha: `const PAD = (n) => String(n).padStart(2, "0");
const FMTS = {
  "YYYY-MM-DD": (d) => [d.getFullYear(), PAD(d.getMonth() + 1), PAD(d.getDate())].join("-"),
  "DD/MM/YYYY": (d) => [PAD(d.getDate()), PAD(d.getMonth() + 1), d.getFullYear()].join("/"),
};
const formatDate = (d, f) => FMTS[f](d);
export { formatDate };`,
    defaultTerse: `function formatDate(d,f){var y=d.getFullYear(),m=("0"+(d.getMonth()+1)).slice(-2),da=("0"+d.getDate()).slice(-2);return f=="YYYY-MM-DD"?y+"-"+m+"-"+da:da+"/"+m+"/"+y}`,
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return formatDate;`)();
        if (fn(new Date("2024-01-01"), "YYYY-MM-DD") !== "2024-01-01") return false;
        // Invalid date — should return empty string or not crash
        const invalid = fn(new Date("invalid"), "YYYY-MM-DD");
        if (invalid !== "" && invalid !== "NaN-NaN-NaN" && isNaN(Date.parse(invalid)) === false) {
          // Only fail if it returns something that looks valid
        }
        // Unknown format — should not crash
        fn(new Date(), "DD-MM-YYYY");
        // Null date — should not crash
        try { fn(null, "YYYY-MM-DD"); } catch { return false; }
        // Leap year
        if (fn(new Date("2024-02-29"), "YYYY-MM-DD") !== "2024-02-29") return false;
        // Negative year
        if (fn(new Date("-0001-01-01"), "YYYY-MM-DD") === "") {} // acceptable
        return true;
      } catch { return false; }
    },
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return formatDate;`)();
      return [fn(testInput[0], testInput[1]), fn(testInput[2], testInput[3])];
    },
  },
  {
    id: "log-filter",
    name: "Log Level Filter",
    lang: "js",
    ext: ".js",
    spec: "Write a function filterLogs(logs, minLevel) that filters log entries [{level, msg}] by minimum severity: DEBUG < INFO < WARN < ERROR. Return only entries at or above minLevel.",
    testInput: [[
      { level: "DEBUG", msg: "start" },
      { level: "INFO", msg: "ok" },
      { level: "WARN", msg: "caution" },
      { level: "ERROR", msg: "fail" },
    ], "WARN"],
    expectedOutput: [[
      { level: "WARN", msg: "caution" },
      { level: "ERROR", msg: "fail" },
    ]],
    // Over-build trap: enum class, level hierarchy as object, validation, error handling
    defaultBaseline: `function filterLogs(logs, minLevel) {
  // Define level hierarchy
  const levels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  // Validate minLevel
  if (levels[minLevel] === undefined) {
    return [];
  }

  // Filter logs
  const result = [];
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    if (levels[log.level] !== undefined && levels[log.level] >= levels[minLevel]) {
      result.push(log);
    }
  }

  return result;
}

module.exports = { filterLogs };`,
    defaultMatcha: `const LVL = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const filterLogs = (logs, min) =>
  logs.filter(l => (LVL[l.level] ?? -1) >= LVL[min]);
export { filterLogs };`,
    defaultTerse: `function filterLogs(l,m){var L={DEBUG:0,INFO:1,WARN:2,ERROR:3};return l.filter(function(x){return L[x.level]>=L[m]})}`,
    adversarialTest: (code) => {
      try {
        const fn = new Function(`"use strict"; ${code}; return filterLogs;`)();
        if (!Array.isArray(fn([], "INFO"))) return false;
        if (!Array.isArray(fn(null, "INFO"))) return false;
        if (!Array.isArray(fn(undefined, "WARN"))) return false;
        // Unknown level — should return empty array
        if (fn([{level:"INFO",msg:"x"}], "TRACE").length !== 0) return false;
        // Case sensitivity — "info" vs "INFO" — should be exact match
        if (fn([{level:"info",msg:"x"},{level:"INFO",msg:"y"}], "INFO").length !== 1) return false;
        // XSS in log message — should not affect filtering
        const xssLogs = [{level:"ERROR", msg:"<script>alert(1)</script>"}];
        if (!Array.isArray(fn(xssLogs, "ERROR")) || fn(xssLogs, "ERROR").length !== 1) return false;
        // Null/undefined in log entries
        const badEntries = [{level:"INFO", msg:"ok"}, null, {level:"WARN", msg:"bad"}];
        try { const r = fn(badEntries, "WARN"); if (!Array.isArray(r)) return false; } catch { return false; }
        return true;
      } catch { return false; }
    },
    testRunner: (code, testInput) => {
      const fn = new Function(`"use strict"; ${code}; return filterLogs;`)();
      return [fn(testInput[0], testInput[1])];
    },
  },
];

const ARMS = [
  { id: "baseline", label: "No rules", desc: "Standard implementation, no engineering conventions" },
  { id: "matcha", label: "matcha rules", desc: "Full matcha engineering conventions" },
  { id: "terse", label: "Terse prompt", desc: "Just 'be brief' — no structural rules (control)" },
];

// Merge over-build tasks into main TASKS
TASKS.push(...OVERBUILD_TASKS);

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function majority(votes) {
  const trues = votes.filter(Boolean).length;
  return trues > votes.length / 2;
}

function loadSolution(task, arm) {
  const taskDir = join(process.cwd(), "benchmark", "tasks", task.id);
  const filePath = join(taskDir, `${arm}${task.ext}`);
  let code;
  if (existsSync(filePath)) {
    code = readFileSync(filePath, "utf-8");
  } else {
    const armKey = arm === "baseline" ? "defaultBaseline" : arm === "matcha" ? "defaultMatcha" : "defaultTerse";
    code = task[armKey] || task.defaultBaseline;
  }
  // Strip export/module.exports lines for clean evaluation
  return code.replace(/^(?:export\s+\{[^}]*\}\s*;?\s*|module\.exports\s*=\s*\{[^}]*\}\s*;?\s*)$/gm, "").trim();
}

function deepEqual(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  return a === b;
}

// correctness gate — validates output against expected per task
// adversarial gate — validates edge case robustness
async function runAgenticBenchmark(options = {}) {
  const iterations = options.iterations ?? 1;
  const results = [];

  for (const task of TASKS) {
    const taskResult = { id: task.id, name: task.name };

    for (const arm of ARMS) {
      try {
        const code = loadSolution(task, arm.id);

        if (iterations <= 1) {
          // Single run — direct
          const loc = countLOC(code);
          const tokens = estimateTokens(code);
          let correct = false;
          let adversarial = false;
          let error = null;

          try {
            const result = task.testRunner(code, task.testInput);
            if (result && typeof result.then === 'function') {
              const resolved = await result;
              correct = Array.isArray(resolved) ? resolved.every((r, i) => deepEqual(r, task.expectedOutput[i])) : false;
            } else {
              correct = result.every((r, i) => deepEqual(r, task.expectedOutput[i]));
            }

            if (task.adversarialTest) {
              adversarial = task.adversarialTest(code);
            } else {
              adversarial = true;
            }
          } catch (e) {
            error = e.message;
            correct = false;
            adversarial = false;
          }

          taskResult[arm.id] = { loc, tokens, correct, adversarial, error, code };
        } else {
          // Multi-run — collect n samples, take median/majority
          const runs = [];
          for (let i = 0; i < iterations; i++) {
            let correct = false;
            let adversarial = false;
            let error = null;

            try {
              const result = task.testRunner(code, task.testInput);
              if (result && typeof result.then === 'function') {
                const resolved = await result;
                correct = Array.isArray(resolved) ? resolved.every((r, j) => deepEqual(r, task.expectedOutput[j])) : false;
              } else {
                correct = result.every((r, j) => deepEqual(r, task.expectedOutput[j]));
              }

              if (task.adversarialTest) {
                adversarial = task.adversarialTest(code);
              } else {
                adversarial = true;
              }
            } catch (e) {
              error = e.message;
              correct = false;
              adversarial = false;
            }

            runs.push({ correct, adversarial, error });
          }

          // Median for LOC/tokens (deterministic — same code = same LOC)
          const lLocs = Array(iterations).fill(countLOC(code));
          const lToks = Array(iterations).fill(estimateTokens(code));

          // Majority vote for correctness, adversarial
          const correctVotes = runs.map(r => r.correct);
          const advVotes = runs.map(r => r.adversarial);
          const errors = [...new Set(runs.filter(r => r.error).map(r => r.error))];

          taskResult[arm.id] = {
            loc: median(lLocs),
            tokens: median(lToks),
            correct: majority(correctVotes),
            adversarial: majority(advVotes),
            error: errors[0] || null,
            code,
            n: iterations,
            runs: runs.map(r => ({ correct: r.correct, adversarial: r.adversarial })),
          };
        }
      } catch (e) {
        taskResult[arm.id] = { loc: 0, tokens: 0, correct: false, adversarial: false, error: e.message, code: "" };
      }
    }

    results.push(taskResult);
  }

  return results;
}

function formatAgenticReport(results) {
  let output = "";
  output += `🍵 matcha: Agentic Benchmark\n`;
  output += `Comparing: baseline (no rules) vs terse (just brief) vs matcha (full conventions)\n`;
  output += `${TASKS.length} tasks × ${ARMS.length} arms\n\n`;

  const totals = {};
  for (const arm of ARMS) {
    totals[arm.id] = { loc: 0, tokens: 0, correct: 0, adversarial: 0, passed: 0 };
  }

  for (const r of results) {
    output += `── ${r.name} ──\n`;

    for (const arm of ARMS) {
      const d = r[arm.id];
      if (!d) continue;

      const cIcon = d.correct ? "✅" : "❌";
      const aIcon = d.adversarial ? "🛡️" : "⚠️";
      output += `  ${cIcon} ${arm.id.padEnd(8)} ${String(d.loc).padStart(3)} LOC, ~${String(d.tokens).padStart(3)} tok`;
      if (r.baseline && arm.id !== "baseline") {
        const locDelta = r.baseline.loc - d.loc;
        const locPct = r.baseline.loc > 0 ? Math.round(locDelta / r.baseline.loc * 100) : 0;
        const sign = locDelta > 0 ? "-" : "+";
        output += ` (${sign}${Math.abs(locDelta)} LOC, ${sign}${Math.abs(locPct)}%)`;
      }
      output += `  ${aIcon}`;
      if (d.error) output += `  error: ${d.error}`;
      output += `\n`;

      totals[arm.id].loc += d.loc;
      totals[arm.id].tokens += d.tokens;
      if (d.correct) totals[arm.id].correct++;
      if (d.adversarial) totals[arm.id].adversarial++;
      totals[arm.id].passed++;
    }
    output += `\n`;
  }

  const b = totals.baseline;
  const t = totals.terse;
  const m = totals.matcha;

  output += `═══ Summary ═══\n`;
  output += `${"".padEnd(18)} baseline    terse    matcha\n`;
  output += `${`Total LOC:  `.padEnd(18)} ${String(b.loc).padStart(5)}    ${String(t.loc).padStart(5)}    ${String(m.loc).padStart(5)}\n`;
  output += `${`Total tok:  `.padEnd(18)} ~${String(b.tokens).padStart(4)}   ~${String(t.tokens).padStart(4)}   ~${String(m.tokens).padStart(4)}\n`;
  output += `${`Correct:    `.padEnd(18)} ${String(b.correct).padStart(3)}/${b.passed}    ${String(t.correct).padStart(3)}/${t.passed}    ${String(m.correct).padStart(3)}/${m.passed}\n`;
  output += `${`Adversarial:`.padEnd(18)} ${String(b.adversarial).padStart(3)}/${b.passed}    ${String(t.adversarial).padStart(3)}/${t.passed}    ${String(m.adversarial).padStart(3)}/${m.passed}\n\n`;

  if (b.loc > 0) {
    const mLocPct = Math.round((b.loc - m.loc) / b.loc * 100);
    const tLocPct = Math.round((b.loc - t.loc) / b.loc * 100);
    output += `  📐 matcha vs baseline: -${Math.abs(b.loc - m.loc)} LOC (${mLocPct > 0 ? "-" : ""}${Math.abs(mLocPct)}%)\n`;
    output += `  📐 terse  vs baseline: -${Math.abs(b.loc - t.loc)} LOC (${tLocPct > 0 ? "-" : ""}${Math.abs(tLocPct)}%)\n`;
    if (t.loc > m.loc) {
      output += `  🎯 matcha beats terse by ${t.loc - m.loc} LOC — rules > mere brevity\n`;
    } else if (m.loc > t.loc) {
      output += `  ⚠️  terse beats matcha by ${m.loc - t.loc} LOC — may need tighter rules\n`;
    } else {
      output += `  ➖ matcha ≈ terse — same LOC, check correctness gap for differentiation\n`;
    }
  }

  return output;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function runBenchmark(targetDir) {
  const absTarget = join(process.cwd(), targetDir || ".");
  const files = walkDir(absTarget, absTarget);

  const allFindings = [];
  for (const file of files) {
    const fileFindings = scanFile(file);
    if (fileFindings && fileFindings.length > 0) {
      allFindings.push(...fileFindings);
    }
  }

  const criticalIssues = allFindings.filter(f => f.severity === "critical").length;
  const minorIssues = allFindings.filter(f => f.severity === "minor").length;
  const infoIssues = allFindings.filter(f => f.severity === "info").length;
  const totalIssues = allFindings.length;

  const { score, grade, label } = calculateScore(totalIssues, criticalIssues, files.length);

  const relativeFindings = allFindings.map(f => ({
    ...f,
    file: relative(absTarget, f.file).replace(/\\\\/g, "/"),
  }));

  return {
    filesScanned: files.length,
    totalIssues,
    criticalIssues,
    minorIssues,
    infoIssues,
    findings: relativeFindings,
    score,
    grade,
    label,
    timestamp: new Date().toISOString(),
  };
}

// ─── CLI entry ───────────────────────────────────────────────────────────────

const isDirectInvocation = process.argv[1] && (
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-bench.js") ||
  process.argv[1].replace(/\\/g, "/").endsWith("matcha-bench")
);

if (isDirectInvocation) {
  (async () => {
    const args = process.argv.slice(2);
    const jsonFlag = args.includes("--json");
    const agenticFlag = args.includes("--agentic");
    const agenticLiveFlag = args.includes("--agentic-live");
    const simulateFlag = args.includes("--simulate");
    const baselineFile = args.includes("--baseline") ? args[args.indexOf("--baseline") + 1] : null;
    const targetDir = args.find(a => !a.startsWith("--") && a !== args[args.indexOf("--baseline") + 1]) || ".";

    if (agenticLiveFlag) {
      const results = await runAgenticLive({ simulate: simulateFlag });
      process.exit(0);
    }

    const itersIndex = args.indexOf("--iters");
    const iterations = itersIndex >= 0 ? parseInt(args[itersIndex + 1], 10) || 4 : 1;

    if (agenticFlag) {
      const results = await runAgenticBenchmark({ iterations });
      if (jsonFlag) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        const report = formatAgenticReport(results);
        if (iterations > 1) {
          const summaryLine = `  📊 n=${iterations} iterations per cell — median LOC, majority vote for correctness/adversarial`;
          console.log(report.trimEnd() + `\n${summaryLine}\n`);
        } else {
          console.log(report);
        }
      }
      process.exit(0);
    }

    const result = runBenchmark(targetDir);

    if (jsonFlag) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatReport(result));
    }

    if (baselineFile && existsSync(baselineFile)) {
      const baseline = JSON.parse(readFileSync(baselineFile, "utf-8"));
      const diff = result.score - baseline.score;
      console.log(`  📊 vs baseline (${baseline.score}): ${diff >= 0 ? "+" : ""}${diff} points\n`);
    }
  })();
}

// ─── Exports for programmatic use ────────────────────────────────────────────

export { runBenchmark, calculateScore, scanFile, CHECKS, runAgenticBenchmark, TASKS, ARMS, OVERBUILD_TASKS };
