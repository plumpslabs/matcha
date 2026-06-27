const { memoize } = require("./solution.js");
let passed = 0, failed = 0;

function check(desc, result, expected) {
  if (result === expected) passed++;
  else { console.error(`FAIL: ${desc} → ${result}, expected ${expected}`); failed++; }
}

let callCount = 0;
const double = memoize((n) => { callCount++; return n * 2; });

check("first call", double(5), 10);
check("call count after first", callCount, 1);
check("cached call", double(5), 10);
check("call count after cached", callCount, 1); // should NOT increment
check("new arg", double(3), 6);
check("call count after new", callCount, 2);

// Non-function
let called = false;
const noop = memoize("not a function");
noop();
if (!called) passed++;
else { console.error("FAIL: noop should not call"); failed++; }

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
