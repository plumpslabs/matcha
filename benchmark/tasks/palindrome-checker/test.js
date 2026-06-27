const { isPalindrome } = require("./solution.js");
let passed = 0, failed = 0;

function check(input, expected) {
  const result = isPalindrome(input);
  if (result === expected) passed++;
  else { console.error(`FAIL: isPalindrome(${JSON.stringify(input)}) → ${result}, expected ${expected}`); failed++; }
}

// Basic palindromes
check("racecar", true);
check("A man, a plan, a canal: Panama", true);
check("Was it a car or a cat I saw?", true);
check("No 'x' in Nixon", true);

// Non-palindromes
check("hello", false);
check("world", false);
check("abc", false);

// Edge cases
check("", true);
check("a", true);
check("aa", true);
check(null, false);
check(undefined, false);
check(123, false);

// Unicode / mixed case
check("Madam", true);
check("RaceCar", true);
check("12321", true);
check("12345", false);

// Injection — should not crash
check("<script>alert(1)</script>", false);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
