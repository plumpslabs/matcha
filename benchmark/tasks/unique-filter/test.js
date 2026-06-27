const { unique } = require("./solution.js");
let passed = 0, failed = 0;

function check(input, key, expected) {
  const result = key ? unique(input, key) : unique(input);
  const ok = JSON.stringify(result) === JSON.stringify(expected);
  if (ok) passed++;
  else { console.error(`FAIL: unique → ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`); failed++; }
}

check([1,2,2,3,1], null, [1,2,3]);
check(["a","b","a","c"], null, ["a","b","c"]);
check([], null, []);
check(null, null, []);
check(undefined, null, []);
check([1,1,1], null, [1]);

// With key function
check([{id:1},{id:2},{id:1}], (x)=>x.id, [{id:1},{id:2}]);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
