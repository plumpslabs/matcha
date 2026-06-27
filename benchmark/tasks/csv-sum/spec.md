# CSV Column Sum

Create a JavaScript file called `solution.js` that exports a function.

## Specification
Write a function `sumColumn(csv, colIndex)` that:
- Takes a CSV string and a column index
- Skips the header row
- Sums all numeric values in the specified column
- Returns the total sum

Example:
```
csv = "a,b,c\n1,2,3\n4,5,6"
sumColumn(csv, 1) → 7  (2 + 5)
```

## Requirements
- File must be named `solution.js`
- Export using `module.exports = { sumColumn };`
- No external dependencies
