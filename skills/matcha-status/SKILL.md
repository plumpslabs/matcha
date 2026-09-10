---
name: matcha-status
description: >
  Show matcha session health dashboard — current intensity, hook states,
  active plan, and recent audit findings.
---

# /matcha-status · Session Health Dashboard

Displays the current matcha governance state for this project.

**Includes:**
- Current mode: `on` / `off` + intensity level (`observe` / `enforce` / `audit`)
- Hook states (shield, planning-gate, post-write, stop, inject-rules)
- Active plan from `.agents/plan/current.md`
- Recent `// matcha:` debt markers in modified files

**Usage:** type `/matcha-status` or run `matcha status` in terminal.
