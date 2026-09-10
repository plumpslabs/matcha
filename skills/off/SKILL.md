---
name: off
description: >-
  Disable matcha governance — completely silent, zero token overhead, zero hook execution.
---

# /matcha:off · Disable Matcha Governance

Completely disable all matcha governance. Zero token overhead, zero friction.

**What silences (truly zero overhead):**
- **Planning Gate**: bypassed, no plan required before edits
- **Safety Shield**: disabled, no command filtering
- **Post-Write Scan**: disabled, no DRY/debt checks
- **Stop Tips**: disabled, no session summary
- **Rule Injection**: disabled, no matcha context in system prompt

## Instructions for Agent
1. Write to `.agents/matcha-state.json`:
   ```json
   {
     "enabled": false,
     "intensity": "off"
   }
   ```
2. Confirm governance is paused to user. Re-enable anytime via `/matcha:on` or `/matcha:toggle`.
