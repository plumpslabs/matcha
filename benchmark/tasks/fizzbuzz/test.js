#!/usr/bin/env node
const { fizzBuzz } = require("./solution.js");
let passed = 0,
  failed = 0;

function check(input, expected) {
  const result = fizzBuzz(input);
  const ok = JSON.stringify(result) === JSON.stringify(expected);
  if (ok) passed++;
  else {
    console.error(`FAIL: fizzBuzz(${input}) → ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`);
    failed++;
  }
}

// Happy path
check(15, [1,2,"Fizz",4,"Buzz","Fizz",7,8,"Fizz","Buzz",11,"Fizz",13,14,"FizzBuzz"]);
check(1, [1]);
check(0, []);

// Boundary: negative — should return empty array
check(-5, []);

// Boundary: float — should handle truncation or round
const floatResult = fizzBuzz(5.5);
if (Array.isArray(floatResult) && floatResult.length === 5) {
  console.log("PASS: float input truncates to 5");
  passed++;
} else {
  console.error(`FAIL: float 5.5 gave length ${floatResult?.length}, expected 5`);
  failed++;
}

// Boundary: NaN — should not crash
const nanResult = fizzBuzz(NaN);
if (Array.isArray(nanResult)) {
  console.log("PASS: NaN returns array");
  passed++;
} else {
  console.error("FAIL: NaN crashed or not array");
  failed++;
}

// Boundary: large n — should complete without hang
const MAX_SAFE = 10000;
const largeResult = fizzBuzz(MAX_SAFE);
if (Array.isArray(largeResult) && largeResult.length === MAX_SAFE) {
  console.log(`PASS: large n=${MAX_SAFE} returns ${MAX_SAFE} items`);
  passed++;
} else {
  console.error(`FAIL: large n gave length ${largeResult?.length}, expected ${MAX_SAFE}`);
  failed++;
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
