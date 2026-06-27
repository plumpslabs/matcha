#!/usr/bin/env node
const { formatDate } = require("./solution.js");
let passed = 0,
  failed = 0;

function check(date, fmt, expected) {
  const result = formatDate(new Date(date), fmt);
  if (result === expected) passed++;
  else {
    console.error(`FAIL: formatDate("${date}", "${fmt}") → "${result}", expected "${expected}"`);
    failed++;
  }
}

// Happy path
check("2024-03-15", "YYYY-MM-DD", "2024-03-15");
check("2024-03-15", "DD/MM/YYYY", "15/03/2024");
check("2024-01-01", "YYYY-MM-DD", "2024-01-01");
check("2023-12-31", "DD/MM/YYYY", "31/12/2023");

// Leap year
check("2024-02-29", "YYYY-MM-DD", "2024-02-29");

// Single-digit month/day
check("2024-03-05", "DD/MM/YYYY", "05/03/2024");

// Unknown format — should return empty string
const unknownResult = formatDate(new Date("2024-01-01"), "DD-MM-YYYY");
if (unknownResult === "") {
  console.log("PASS: unknown format returns empty string");
  passed++;
} else {
  console.error(`FAIL: unknown format returned "${unknownResult}", expected ""`);
  failed++;
}

// Null date — should not crash
const nullResult = formatDate(null, "YYYY-MM-DD");
if (nullResult === "" || nullResult === undefined || nullResult === null) {
  console.log("PASS: null date handled");
  passed++;
} else {
  console.error(`FAIL: null date returned "${nullResult}"`);
  failed++;
}

// Invalid date string — should not crash
const invalidResult = formatDate(new Date("not-a-date"), "YYYY-MM-DD");
if (invalidResult !== undefined && invalidResult !== null) {
  console.log("PASS: invalid date handled");
  passed++;
} else {
  console.error(`FAIL: invalid date crashed`);
  failed++;
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
