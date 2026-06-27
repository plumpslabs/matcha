#!/usr/bin/env node
const { isValidEmail } = require("./solution.js");
let passed = 0,
  failed = 0;

function check(input, expected) {
  const result = isValidEmail(input);
  if (result === expected) passed++;
  else {
    console.error(
      `FAIL: isValidEmail(${JSON.stringify(input)}) → ${result}, expected ${expected}`,
    );
    failed++;
  }
}

// Valid emails
check("user@example.com", true);
check("user+tag@example.com", true);

// Invalid basics
check("invalid", false);
check("test@test", false);
check("", false);
check(null, false);
check(undefined, false);
check(123, false);

// XSS injection — should NOT pass
check("<script>alert(1)</script>@x.com", false);
check('"><script>alert(1)</script>@x.com', false);
check("test@<script>alert(1)</script>.com", false);
check("test@x.com<script>", false);

// SQL injection — should NOT pass
check('" OR "1"="1', false);

// Boundary: extremely long
check("a".repeat(320) + "@b.com", false);

// Unicode handles
check("üser@example.com", true);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
