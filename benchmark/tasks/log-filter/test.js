#!/usr/bin/env node
const { filterLogs } = require("./solution.js");
let passed = 0,
  failed = 0;

const logs = [
  { level: "DEBUG", msg: "start" },
  { level: "INFO", msg: "ok" },
  { level: "WARN", msg: "caution" },
  { level: "ERROR", msg: "fail" },
];

function check(minLevel, expected) {
  const result = filterLogs(logs, minLevel);
  const ok = JSON.stringify(result) === JSON.stringify(expected);
  if (ok) passed++;
  else {
    console.error(`FAIL: filterLogs(_, "${minLevel}") → ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`);
    failed++;
  }
}

// Happy path
check("WARN", [
  { level: "WARN", msg: "caution" },
  { level: "ERROR", msg: "fail" },
]);
check("DEBUG", logs);
check("ERROR", [{ level: "ERROR", msg: "fail" }]);
check("", []);

// Boundary: null/undefined logs — should return empty array
const nullResult = filterLogs(null, "INFO");
if (Array.isArray(nullResult)) { console.log("PASS: null logs returns empty array"); passed++; }
else { console.error("FAIL: null logs not array"); failed++; }

const undefResult = filterLogs(undefined, "WARN");
if (Array.isArray(undefResult)) { console.log("PASS: undefined logs returns array"); passed++; }
else { console.error("FAIL: undefined logs not array"); failed++; }

// Boundary: unknown level — should return empty array
const unknownResult = filterLogs(logs, "TRACE");
if (Array.isArray(unknownResult) && unknownResult.length === 0) {
  console.log("PASS: unknown level returns empty array");
  passed++;
} else {
  console.error(`FAIL: unknown level returned ${unknownResult?.length} items`);
  failed++;
}

// Boundary: case sensitivity — "info" vs "INFO"
const caseLogs = [{level:"info",msg:"x"},{level:"INFO",msg:"y"}];
const caseResult = filterLogs(caseLogs, "INFO");
if (Array.isArray(caseResult) && caseResult.length === 1) {
  console.log("PASS: case-sensitive level matching");
  passed++;
} else {
  console.error(`FAIL: case-sensitive: got ${caseResult?.length} items, expected 1`);
  failed++;
}

// Boundary: null entries in logs array
const badEntries = [{level:"INFO", msg:"ok"}, null, {level:"ERROR", msg:"bad"}];
try {
  const badResult = filterLogs(badEntries, "ERROR");
  if (Array.isArray(badResult)) {
    console.log("PASS: handles null entries in logs");
    passed++;
  } else {
    console.error("FAIL: bad entries not array");
    failed++;
  }
} catch (e) {
  console.error(`FAIL: crashed on null entries: ${e.message}`);
  failed++;
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
