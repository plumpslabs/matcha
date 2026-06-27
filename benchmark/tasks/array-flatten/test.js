#!/usr/bin/env node
const { flatten } = require("./solution.js");
let passed = 0,
  failed = 0;

function check(input, expected) {
  const result = flatten(input);
  const ok = JSON.stringify(result) === JSON.stringify(expected);
  if (ok) passed++;
  else {
    console.error(`FAIL: flatten(${JSON.stringify(input)}) → ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`);
    failed++;
  }
}

// Happy path
check([1,[2,[3,4]],5], [1,2,3,4,5]);
check([], []);
check([1,2,3], [1,2,3]);
check([[1],[[2]],[[[3]]]], [1,2,3]);

// Boundary: non-array inputs — should return empty array or not crash
const nullResult = flatten(null);
if (Array.isArray(nullResult)) { console.log("PASS: flatten(null) returns array"); passed++; }
else { console.error("FAIL: flatten(null) not array"); failed++; }

const undefResult = flatten(undefined);
if (Array.isArray(undefResult)) { console.log("PASS: flatten(undefined) returns array"); passed++; }
else { console.error("FAIL: flatten(undefined) not array"); failed++; }

const strResult = flatten("string");
if (Array.isArray(strResult)) { console.log("PASS: flatten(string) returns array"); passed++; }
else { console.error("FAIL: flatten(string) not array"); failed++; }

// Boundary: very deep nesting
const deep = [1];
let ref = deep;
for (let i = 0; i < 100; i++) { ref.push([i]); ref = ref[1]; }
const deepResult = flatten(deep);
if (Array.isArray(deepResult) && deepResult.length > 50) {
  console.log("PASS: deeply nested array flattens");
  passed++;
} else {
  console.error(`FAIL: deep nested gave ${deepResult?.length} items, expected > 50`);
  failed++;
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
