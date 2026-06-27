const { retry } = require("./solution.js");
let passed = 0, failed = 0;

async function check(input, expected) {
  const result = await input;
  if (result === expected) passed++;
  else { console.error(`FAIL: expected ${expected}, got ${result}`); failed++; }
}

async function run() {
  // Success on first try
  let count1 = 0;
  await check(retry(async () => { count1++; return "ok"; }, 3, 10), "ok");
  if (count1 !== 1) { console.error(`FAIL: called ${count1} times, expected 1`); failed++; } else passed++;

  // Fail first, then succeed
  let count2 = 0;
  await check(retry(async () => { count2++; if (count2 < 2) throw new Error("fail"); return "recovered"; }, 3, 10), "recovered");

  // All retries fail
  try {
    await retry(async () => { throw new Error("always fail"); }, 2, 10);
    console.error("FAIL: should have thrown"); failed++;
  } catch (e) { passed++; }

  // Non-function
  try {
    await retry("not a function");
    console.error("FAIL: should have rejected"); failed++;
  } catch (e) { passed++; }

  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
