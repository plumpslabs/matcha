const { deepMerge } = require("./solution.js");
let passed = 0, failed = 0;

function check(input1, input2, expected) {
  // deepMerge should not mutate inputs
  const c1 = JSON.parse(JSON.stringify(input1));
  const result = deepMerge(input1, input2);
  // Compare ignoring undefined values
  const ok = JSON.stringify(result) === JSON.stringify(expected);
  if (ok) passed++;
  else { console.error(`FAIL: deepMerge(${JSON.stringify(input1)}, ${JSON.stringify(input2)}) → ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`); failed++; }
}

check({ a: 1 }, { b: 2 }, { a: 1, b: 2 });
check({ a: 1, b: { c: 2 } }, { b: { d: 3 } }, { a: 1, b: { c: 2, d: 3 } });
check({ a: [1, 2] }, { a: [3] }, { a: [1, 2, 3] });
check(null, { a: 1 }, { a: 1 });
check({ a: 1 }, null, { a: 1 });
check(null, null, {});
check(undefined, { a: 1 }, {});
check({ a: 1 }, { a: 2 }, { a: 2 });

// Deep nesting
const deepA = { a: { b: { c: 1 } } };
const deepB = { a: { b: { d: 2 } } };
check(deepA, deepB, { a: { b: { c: 1, d: 2 } } });

// No mutation
const orig = { a: { b: 1 } };
const result = deepMerge(orig, { a: { c: 2 } });
if (orig.a.b !== 1 && result.a.c === 2) passed++;
else { console.error("FAIL: mutation detected"); failed++; }

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
