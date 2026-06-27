# Deep Get

Create `solution.js` that exports `deepGet(obj, path)`.

## Specification
Safely get a nested property from an object using a dot-separated path string. Return `undefined` if any level doesn't exist.

## Rules
- Path is a string like "a.b.c"
- Return the value at path, or `undefined` if not found
- Handle array indices in path (e.g., "a.0.b")
- Null/undefined input → `undefined`
- Empty path → return obj
- Export using `module.exports = { deepGet };`
