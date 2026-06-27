const { anagramGroups } = require("./solution.js");
let passed = 0, failed = 0;

function check(input, expected) {
  const result = anagramGroups(input);
  const ok = JSON.stringify(result.sort((a,b)=>a[0].localeCompare(b[0]))) === JSON.stringify(expected.sort((a,b)=>a[0].localeCompare(b[0])));
  if (ok) passed++;
  else { console.error(`FAIL: anagramGroups(${JSON.stringify(input)}) → ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`); failed++; }
}

check(["eat","tea","tan","ate","nat","bat"], [["eat","tea","ate"],["tan","nat"],["bat"]]);
check([""], [[""]]);
check(["a"], [["a"]]);
check(["a","a","a"], [["a","a","a"]]);
check([], []);
check(null, []);
check(undefined, []);
check(123, []);

// Case sensitivity
check(["Abc","bac","cAb"], [["Abc","bac","cAb"]]);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
