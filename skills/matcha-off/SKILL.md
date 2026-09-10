---
name: matcha-off
description: >
  Disable matcha governance — completely silence all lifecycle hooks, gates,
  scans, and tips. Agent runs with zero matcha overhead.
---

# /matcha-off · Disable matcha

Run `matcha off` in the terminal to completely silence all matcha guardrails.

**What silences (zero token overhead):**
- Planning gate → disabled (no gate blocks writes)
- Shield → disabled (no destructive-command checks)
- Post-write scan → disabled (no DRY/debt checks)
- Stop tips → disabled (no session summary)
- Rule injection → disabled (no matcha context injected)

**Usage:** type `/matcha-off` or run `matcha off` in terminal.
