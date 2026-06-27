# Memoize

Create `solution.js` that exports `memoize(fn)`.

## Specification
Return a memoized version of `fn` that caches results based on arguments. Uses strict equality (`===`) for argument comparison. Single argument only (for simplicity).

## Rules
- Cache key = first argument (use `===` comparison)
- If called with same arg again, return cached result (don't call `fn` again)
- Non-function fn → return noop
- Handle `undefined` as key
- Export using `module.exports = { memoize };`
