const { chunk } = require("./solution.js");
let passed = 0, failed = 0;

function check(input, size, expected) {
  const result = chunk(input, size);
  const ok = JSON.stringify(result) === JSON.stringify(expected);
  if (ok) passed++;
  else { console.error(`FAIL: chunk(${JSON.stringify(input)}, ${size}) → ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`); failed++; }
}

check([1,2,3,4,5], 2, [[1,2],[3,4],[5]]);
check([1,2,3,4,5], 3, [[1,2,3],[4,5]]);
check([1,2,3,4,5], 1, [[1],[2],[3],[4],[5]]);
check([1,2,3,4,5], 5, [[1,2,3,4,5]]);
check([1,2,3,4,5], 10, [[1,2,3,4,5]]);
check([], 2, []);
check(null, 2, []);
check(undefined, 2, []);
check([1,2,3], 0, []);
check([1,2,3], -1, []);
check("abc", 2, []);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
