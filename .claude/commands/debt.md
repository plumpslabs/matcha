# /matcha:debt

Harvest all `matcha:` shortcuts in the codebase into a technical debt ledger.

## Instructions for agent

1. Scan codebase for `matcha:` comments
2. Extract: file, line, ceiling, upgrade path
3. Group by severity (missing upgrade path = HIGH)
4. Print report with total count and recommendations