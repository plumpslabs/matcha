# Retry Async

Create `solution.js` that exports `retry(fn, retries, delay)`.

## Specification
Retry an async function `fn` up to `retries` times with `delay` ms between attempts. Returns the resolved value of `fn`. If all retries fail, throw the last error.

## Rules
- `fn` is async (returns a promise)
- `retries` defaults to 3, `delay` defaults to 1000
- Non-function fn → reject immediately
- Between retries, wait `delay` ms
- Export using `module.exports = { retry };`
