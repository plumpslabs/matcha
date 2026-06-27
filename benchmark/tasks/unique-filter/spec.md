# Unique Filter

Create `solution.js` that exports `unique(arr, key)`.

## Specification
Filter an array to keep only unique values. If `key` is provided (a function), use it to compute the comparison key for each element. If no key, use strict equality.

## Rules
- Non-array input → `[]`
- Without key: filter by value equality (first occurrence wins)
- With key: filter by applying key() and comparing results
- Preserve original order
- Export using `module.exports = { unique };`
