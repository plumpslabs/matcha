const { deepGet } = require("./solution.js");
let passed = 0, failed = 0;

function check(obj, path, expected) {
  const result = deepGet(obj, path);
  if (result === expected) passed++;
  else { console.error(`FAIL: deepGet(${JSON.stringify(obj)}, "${path}") → ${result}, expected ${expected}`); failed++; }
}

check({ a: 1 }, "a", 1);
check({ a: { b: 2 } }, "a.b", 2);
check({ a: { b: { c: 3 } } }, "a.b.c", 3);
check({ a: 1 }, "b", undefined);
check({}, "a.b", undefined);
check(null, "a", undefined);
check(undefined, "a", undefined);
check({ a: [1, { b: 2 }] }, "a.1.b", 2);
check({ a: 1 }, "", { a: 1 });
check({ a: { b: null } }, "a.b", null);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
