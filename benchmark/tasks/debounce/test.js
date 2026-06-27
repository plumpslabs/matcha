#!/usr/bin/env node
const { debounce } = require("./solution.js");
let passed = 0,
  failed = 0;

// Test: only the last call should fire
let callCount = 0;
const debounced = debounce(() => { callCount++; }, 50);

debounced();
debounced();
debounced();

setTimeout(() => {
  if (callCount === 1) {
    console.log("PASS: debounce called once after rapid invocations");
    passed++;
  } else {
    console.error(`FAIL: debounce called ${callCount} times, expected 1`);
    failed++;
  }

  // Test: null/undefined fn — should not crash
  try {
    debounce(null, 0);
    debounce(undefined, -1);
    console.log("PASS: debounce handles null/undefined fn");
    passed++;
  } catch (e) {
    console.error(`FAIL: debounce threw on null/undefined: ${e.message}`);
    failed++;
  }

  // Test: negative delay — should not crash
  try {
    debounce(() => {}, -100);
    console.log("PASS: debounce handles negative delay");
    passed++;
  } catch (e) {
    console.error(`FAIL: debounce threw on negative delay: ${e.message}`);
    failed++;
  }

  // Test: zero delay — should still debounce
  let zeroCount = 0;
  const zeroDebounced = debounce(() => { zeroCount++; }, 0);
  zeroDebounced();
  zeroDebounced();
  setTimeout(() => {
    if (zeroCount === 1) {
      console.log("PASS: debounce with zero delay works");
      passed++;
    } else {
      console.error(`FAIL: zero delay debounce called ${zeroCount} times`);
      failed++;
    }

    // Test: non-function first arg — should not crash
    try {
      debounce("not a function", 100);
      debounce(42, 100);
      console.log("PASS: debounce handles non-function args");
      passed++;
    } catch (e) {
      console.error(`FAIL: debounce threw on non-function: ${e.message}`);
      failed++;
    }

    console.log(`${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }, 50);
}, 100);
