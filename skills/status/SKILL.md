---
name: status
description: >-
  Show matcha session health dashboard (governance mode, intensity, hook states, active plan).
---

# /matcha:status · Session Health Dashboard

Display current matcha governance status:
- Mode: ON / OFF
- Intensity: observe / enforce / audit
- Active plan status in `.agents/plan/current.md`
- Hook health and metrics

## Instructions for Agent
Read `.agents/matcha-state.json` and `.agents/plan/current.md`, then display formatted status dashboard to user.
