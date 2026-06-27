# Throttle

Create `solution.js` that exports `throttle(fn, wait)`.

## Specification
Returns a throttled version of `fn` that is called at most once every `wait` ms. The first call is immediate. Subsequent calls during the wait period are queued and the last one executes after the cooldown.

## Rules
- Leading edge: first call fires immediately
- Trailing edge: last call during cooldown fires after wait
- Cancel pending call if not needed (only queue 1)
- Non-function fn → return noop
- Export using `module.exports = { throttle };`
