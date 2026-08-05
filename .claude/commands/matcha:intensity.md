---
description: "🍵 Set matcha intensity level: observe, enforce, or audit"
---
# /matcha:intensity

Set intensity level for current session.
Usage: `/matcha observe|enforce|audit`

**When to use:** at session start or when switching work types — observe for exploration, enforce for normal work (default), audit for critical/high-stakes work.

## Checklists

**observe** — tips only: flag leftover debug statements (e.g. `console.log`/`print`/`println!` via `patterns.json`)/TODO optionally, syntax check optional.

**enforce** (default):
- Planning gate: <what> references files, <why> needs evidence, <how> 2+ steps
- Cleanup: remove debug statements, commented code, unused imports
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