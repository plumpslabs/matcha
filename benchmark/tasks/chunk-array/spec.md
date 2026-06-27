# Chunk Array

Create `solution.js` that exports `chunk(arr, size)`.

## Specification
Split an array into chunks of the given size. Last chunk may be smaller if array length not divisible by size. Return array of chunks.

## Rules
- Non-array input → `[]`
- Non-positive or non-number size → return empty array
- Empty array → `[]`
- size of 1 → array of singletons
- Export using `module.exports = { chunk };`
