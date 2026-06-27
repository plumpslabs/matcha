const { throttle } = require("./solution.js");
let passed = 0, failed = 0;

async function run() {
  let calls = [];
  const fn = throttle((x) => { calls.push(x); }, 50);

  // First call fires immediately
  fn("a");
  if (calls.length === 1 && calls[0] === "a") passed++;
  else { console.error("FAIL: first call not immediate"); failed++; }

  // Rapid calls — should be throttled
  fn("b");
  fn("c");
  fn("d");

  if (calls.length === 1) passed++;
  else { console.error(`FAIL: expected 1 call, got ${calls.length}`); failed++; }

  // Wait, then the trailing edge should fire
  await new Promise(r => setTimeout(r, 80));

  if (calls.length === 2 && calls[1] === "d") passed++;
  else { console.error(`FAIL: expected trailing call 'd', got ${JSON.stringify(calls)}`); failed++; }

  // Non-function
  const noop = throttle("not a function", 100);
  noop();
  if (calls.length === 2) passed++;
  else { console.error("FAIL: noop should not call"); failed++; }

  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
