# Log Level Filter

Create a JavaScript file called `solution.js` that exports a function.

## Specification
Write a function `filterLogs(logs, minLevel)` that:
- Takes an array of log entries `[{level, msg}]` and a minimum level string
- Filters entries at or above the minimum severity level
- Level hierarchy: DEBUG < INFO < WARN < ERROR
- Returns only entries at or above minLevel

Example:
```
logs = [
  { level: "DEBUG", msg: "start" },
  { level: "INFO", msg: "ok" },
  { level: "WARN", msg: "caution" },
  { level: "ERROR", msg: "fail" }
]
filterLogs(logs, "WARN") → [{level:"WARN",msg:"caution"}, {level:"ERROR",msg:"fail"}]
```

## Requirements
- File must be named `solution.js`
- Export using `module.exports = { filterLogs };`
- No external dependencies
