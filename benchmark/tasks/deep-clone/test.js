const { deepClone } = require("./solution.js");
let passed = 0, failed = 0;

function check(input) {
  const result = deepClone(input);
  const same = JSON.stringify(result) === JSON.stringify(input);
  const notRef = result !== input;
  if (same && notRef) passed++;
  else { console.error(`FAIL: deepClone(${JSON.stringify(input)})`); if (!same) console.error("  content mismatch"); if (!notRef) console.error("  same reference"); failed++; }
}

check(42);
check("hello");
check(null);
check(true);
check(undefined);
check([1, 2, 3]);
check({ a: 1, b: 2 });
check({ a: [1, { b: 2 }], c: { d: [3] } });

// Date
const d = new Date("2024-01-01");
const dc = deepClone(d);
if (dc instanceof Date && dc.getTime() === d.getTime() && dc !== d) passed++;
else { console.error("FAIL: deepClone Date"); failed++; }

// Empty
check({});
check([]);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
