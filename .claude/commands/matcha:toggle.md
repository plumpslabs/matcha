---
description: "🍵 Toggle matcha governance on/off (instant switch)"
---
# /matcha:toggle

Toggle matcha governance enforcement on or off for the current workspace.

**When to use:** when you want to quickly switch between full governance (enforce) and unconstrained exploration (off), or vice versa.

## Instructions for agent

1. Read `.agents/matcha-state.json`.
2. Check `enabled` status:
   - If currently `false` or `intensity == "off"`:
     - Set `{"enabled": true, "intensity": "enforce"}` in `.agents/matcha-state.json`.
     - Record audit event to `.agents/audit.log`.
     - Confirm:
       ```
       🍵 matcha: governance ENABLED
       - State: 🟢 Active
       - Mode: enforce
       - Planning Gate: active
       - Safety Shield: active
       ```
   - If currently `true` or not off:
     - Set `{"enabled": false, "intensity": "off"}` in `.agents/matcha-state.json`.
     - Record audit event to `.agents/audit.log`.
     - Confirm:
       ```
       🍵 matcha: governance PAUSED (off)
       - State: ⏸ Disabled
       - Planning Gate: bypassed
       - Audit Trail: logged to .agents/audit.log
       - To re-enable: /matcha:on or /matcha:toggle
       ```