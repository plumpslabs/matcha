const { parseConfig } = require("./solution.js");
let passed = 0, failed = 0;

function check(input, expected) {
  const result = parseConfig(input);
  const ok = JSON.stringify(result) === JSON.stringify(expected);
  if (ok) passed++;
  else { console.error(`FAIL: parseConfig(...) → ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`); failed++; }
}

check("key=value", { key: "value" });
check("  key  =  value  ", { key: "value" });
check("# comment\nkey=val", { key: "val" });
check("; comment\nkey=val", { key: "val" });
check("a=1\n\nb=2\n#c=3", { a: "1", b: "2" });
check("a=1\na=2", { a: "2" });
check("", {});
check("   \n# comment\n  ", {});
check(null, {});
check(undefined, {});

// With spaces in value
check("name=John Doe", { name: "John Doe" });

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
