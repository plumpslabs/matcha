#!/usr/bin/env node
const { sumColumn } = require("./solution.js");
let passed = 0,
  failed = 0;

function check(csv, col, expected) {
  const result = sumColumn(csv, col);
  if (result === expected) passed++;
  else {
    console.error(`FAIL: sumColumn(${JSON.stringify(csv)}, ${col}) → ${result}, expected ${expected}`);
    failed++;
  }
}

// Happy path
check("a,b,c\n1,2,3\n4,5,6", 1, 7);
check("a,b,c\n1,2,3\n4,5,6", 0, 5);
check("x\n10\n20", 0, 30);

// Empty / edge
check("", 0, 0);
check("a,b\n", 0, 0);

// Path traversal strings as data — should sum numeric values
check("a,b\n../../../etc/passwd,2\nx,3", 1, 5);

// SQL injection in CSV content
check('a,b\n"\' OR \'1\'=\'1",1', 1, 1);

// Non-numeric column — treat as 0
check("a,b\nx,y\np,q", 1, 0);

// Negative numbers
check("a,b\n1,-2\n3,4", 1, 2);

// NaN in data
check("a,b\nNaN,1", 1, 1);

// Infinity in data
check("a,b\nInfinity,1", 1, 1);

// Out-of-bounds column index
check("a,b\n1,2", 5, 0);
check("a,b\n1,2", -1, 0);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
