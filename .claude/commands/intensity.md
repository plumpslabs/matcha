---
description: "🍵 Set matcha intensity level: observe, enforce, or audit"
alias: ["matcha:intensity", "intensity"]
---
# /matcha observe|enforce|audit

Set intensity level for current session.

## Checklists

**observe** — tips only: flag console.log/TODO optionally, syntax check optional.

**enforce** (default):
- Planning gate: <what> references files, <why> needs evidence, <how> 2+ steps
- Cleanup: remove console.log, commented code, unused imports
- Verify: syntax ✅, typecheck ✅, tests detected ⚠️

**audit** (strict):
- Enforce rules + no files >300 lines, all env vars documented
- Verify: syntax ✅, typecheck ✅, lint ✅, tests must exist ✅

## Instructions
Persist intensity to `.agents/matcha-state.json`:
```json
{"intensity": "observe|enforce|audit"}
```
Confirm with:
```
🍵 matcha: intensity set to [observe|enforce|audit]
```