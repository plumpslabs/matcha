# Semver Compare

Create `solution.js` that exports `semverCompare(a, b)`.

## Specification
Compare two semver version strings (MAJOR.MINOR.PATCH). Return 1 if a > b, -1 if a < b, 0 if equal.

## Rules
- Inputs are always valid semver format (e.g., "1.2.3")
- Each part is a non-negative integer
- Compare MAJOR first, then MINOR, then PATCH
- Export using `module.exports = { semverCompare };`
