---
description: "🍵 Disable matcha — completely silent, zero token overhead"
---
# /matcha:off

Completely disable all matcha governance. Zero token overhead, zero friction. Agent behaves as if matcha is not installed.

**When to use:**
- Rapid prototyping / throwaway experiments
- Debugging a tricky issue where gate friction slows you down
- Pair coding sessions where you want raw agent speed
- Exploring an unfamiliar codebase before planning

**What silences (truly zero overhead):**
- **Planning Gate** → disabled, no plan required before edits
- **Safety Shield** → disabled, no command filtering
- **Post-Write Scan** → disabled, no DRY/debt checks after writes
- **Stop Tips** → disabled, no session summary
- **Rule Injection** → disabled, no matcha context in system prompt

> 💡 This is real OFF — not "observe mode". The hooks return immediately with no processing, no token cost, no LLM context injection.

## Instructions for agent

1. Write to `.agents/matcha-state.json`:
   ```json
   {
     "enabled": false,
     "intensity": "off"
   }
   ```
2. Confirm to user:
   ```
   🍵 matcha: governance OFF
   ─────────────────────────────
   State:    ⏸ Disabled
   Overhead: zero — no hooks, no scans, no injections
   
   All guardrails silent. Agent runs unrestricted.
   To re-enable: /matcha:on or /matcha:toggle
   ```

## Terminal shortcut
```bash
matcha off
```
