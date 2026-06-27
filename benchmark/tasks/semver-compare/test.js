const { semverCompare } = require("./solution.js");
let passed = 0, failed = 0;

function check(a, b, expected) {
  const result = semverCompare(a, b);
  if (result === expected) passed++;
  else { console.error(`FAIL: semverCompare("${a}", "${b}") → ${result}, expected ${expected}`); failed++; }
}

check("1.0.0", "1.0.0", 0);
check("2.0.0", "1.0.0", 1);
check("1.0.0", "2.0.0", -1);
check("1.2.0", "1.1.9", 1);
check("1.1.9", "1.2.0", -1);
check("1.0.1", "1.0.0", 1);
check("1.0.0", "1.0.1", -1);
check("0.0.1", "0.0.1", 0);
check("10.0.0", "9.0.0", 1);
check("1.10.0", "1.9.0", 1);
check("1.0.10", "1.0.9", 1);

// Edge: major version only matters
check("2.0.0", "1.999.999", 1);
check("1.999.999", "2.0.0", -1);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
