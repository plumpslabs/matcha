#!/usr/bin/env node
const { isValidEmail } = require("./solution.js");
let passed = 0,
  failed = 0;

function check(input, expected) {
  const result = isValidEmail(input);
  if (result === expected) passed++;
  else {
    console.error(`FAIL: isValidEmail(${JSON.stringify(input)}) → ${result}, expected ${expected}`);
    failed++;
  }
}

check("user@example.com", true);
check("invalid", false);
check("test@test", false);
check("", false);
check(null, false);
check(undefined, false);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
