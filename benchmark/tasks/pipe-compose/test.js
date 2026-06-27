const { pipe } = require("./solution.js");
let passed = 0, failed = 0;

function check(desc, result, expected) {
  if (result === expected) passed++;
  else { console.error(`FAIL: ${desc} → ${result}, expected ${expected}`); failed++; }
}

const add1 = (x) => x + 1;
const double = (x) => x * 2;
const toString = (x) => String(x);

check("single fn", pipe(add1)(5), 6);
check("two fns", pipe(add1, double)(5), 12);  // (5+1)*2
check("three fns", pipe(add1, double, toString)(5), "12");

// No fns = identity
check("no fns", pipe()(42), 42);

// Non-function throws
try {
  pipe(add1, "not a function");
  console.error("FAIL: should throw for non-function arg"); failed++;
} catch (e) { passed++; }

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
