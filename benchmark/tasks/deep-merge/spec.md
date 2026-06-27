# Deep Merge

Create `solution.js` that exports `deepMerge(target, source)`.

## Specification
Deep merge two objects: recursively merge properties from `source` into `target`. Arrays should be concatenated (not merged by index). Primitives from `source` override `target`.

## Rules
- Both inputs can be null/undefined → return `{}`
- Arrays: concatenate rather than merge by index
- Nested objects: merge recursively
- Do not mutate source or target (return new object)
- Export using `module.exports = { deepMerge };`
