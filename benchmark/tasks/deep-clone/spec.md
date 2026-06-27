# Deep Clone

Create `solution.js` that exports `deepClone(value)`.

## Specification
Deep clone a value: return a new object/array with all nested values recursively copied. Handle objects, arrays, primitives, null, and Date.

## Rules
- Primitives: return as-is
- null/undefined: return as-is
- Arrays: deep clone each element
- Objects: deep clone each property
- Date: return new Date with same time
- Circular references: not required (assume no cycles)
- Export using `module.exports = { deepClone };`
