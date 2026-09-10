---
description: "🍵 Enable matcha governance and safety guardrails"
---
# /matcha:on

Enable matcha governance enforcement.

**When to use:** when resuming standard development or production-ready implementation.

## Instructions for agent

1. Set in `.agents/matcha-state.json`:
   ```json
   {
     "enabled": true,
     "intensity": "enforce"
   }
   ```
2. Log state change in `.agents/audit.log`.
3. Confirm with:
   ```
   🍵 matcha: governance ENABLED
   - State: 🟢 Active
   - Mode: enforce
   - Planning Gate: active (.agents/plan/current.md required before code edits)
   - Safety Shield: active (blocking destructive commands)
   ```