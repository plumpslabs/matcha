# /matcha:stats

Show session health statistics — files changed, test results, decisions, markers.

## Displayed Metrics
- **Files changed** — git diff stat (insertions/deletions)
- **Tests** — pass/fail count from `npm test`
- **Decisions** — count from `.agents/plan/decisions.log`
- **Matcha markers** — count of `// matcha:` comments in codebase
- **Duration** — elapsed time since session start
- **Intensity** — current intensity level

## Usage
```
node bin/matcha.js stats
```
Or via slash command in supported platforms: `/matcha:stats`

## Purpose
Gives a quick health check of the current session. Useful mid-session to track progress and before wrapping up to verify nothing is left behind.