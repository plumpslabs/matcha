# Config Parser

Create `solution.js` that exports `parseConfig(str)`.

## Specification
Parse a simple INI-style config string into an object. Each line is a `key=value` pair. Comments start with `#` or `;` and are ignored. Empty lines are skipped. Keys are trimmed, values are trimmed.

## Rules
- Lines: `key = value` (ignore whitespace around `=`)
- Comments: lines starting with `#` or `;` (after optional whitespace)
- Duplicate keys: last one wins
- Empty/invalid lines: silently skip
- Non-string input → return `{}`
- Export using `module.exports = { parseConfig };`
