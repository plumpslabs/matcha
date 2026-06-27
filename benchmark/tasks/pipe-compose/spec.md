# Pipe / Compose

Create `solution.js` that exports `pipe(...fns)`.

## Specification
Create a function composition utility. `pipe` takes multiple functions and returns a new function that passes the initial argument through each function left-to-right. The result of each function becomes input to the next.

## Rules
- `pipe(f, g, h)(x)` = `h(g(f(x)))` — left-to-right
- If no functions passed, return identity function `(x) => x`
- If any argument is non-function, throw
- Export using `module.exports = { pipe };`
