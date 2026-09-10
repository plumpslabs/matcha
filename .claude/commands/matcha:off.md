---
description: "🍵 Pause matcha governance and planning gate restrictions (Free Mode)"
---
# /matcha:off

Pause matcha governance enforcement. Allows editing files without planning gate or strict conventions.

**When to use:** during rapid prototyping, scratch experimentation, or when debugging manual steps without gate friction.

## Instructions for agent

1. Set in `.agents/matcha-state.json`:
   ```json
   {
     "enabled": false,
     "intensity": "off"
   }
   ```
2. Log state change to `.agents/audit.log`.
3. Confirm with:
   ```
   🍵 matcha: governance PAUSED (off)
   - State: ⏸ Disabled
   - Planning Gate: bypassed (unrestricted edits)
   - Safety Shield: default-deny retained for catastrophic commands (rm -rf /)
   - Audit Trail: logged to .agents/audit.log
   - To re-enable: /matcha:on or /matcha:toggle
   ```