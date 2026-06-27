---
description: "🍵 matcha cleanup — scan for debug code, temp artifacts, and unused code"
globs: ["**/*.{ts,tsx,js,jsx,py,go,java,php}"]
alwaysApply: false
---

# 🧹 matcha Cleanup

**Done = working AND clean.** Remove before commit:

## 🔴 Must Fix
- `console.log` / `print()` / `debugger` — debug code
- Empty `catch {}` blocks — silently swallows errors
- Hardcoded secrets/tokens/API keys — use env vars
- Commented-out code blocks (not docs)

## 🟡 Should Fix
- Unused imports / variables
- `TODO` / `FIXME` / `HACK` — resolve or create ticket
- Temp files (`.log`, `.tmp`, `.swp`)
- `// matcha: [reason]` on deliberate shortcuts → keep or resolve
