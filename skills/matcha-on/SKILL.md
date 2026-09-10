---
name: matcha-on
description: >
  Enable matcha governance — activate all lifecycle hooks, planning gates,
  shields, and review tips for this project session.
---

# /matcha-on · Enable matcha

Run `matcha on` in the terminal to enable all matcha guardrails for this session.

**What activates:**
- Planning gate (requires `.agents/plan/current.md` before first edit)
- Shield (blocks destructive commands)
- Post-write scan (DRY + debt marker check after each file write)
- Stop tips (session health summary on agent stop)
- Rule injection (matcha principles in system context)

**Usage:** type `/matcha-on` or run `matcha on` in terminal.
