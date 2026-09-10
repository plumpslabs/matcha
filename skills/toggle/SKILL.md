---
name: toggle
description: >-
  Toggle matcha governance on or off — flips the current state and reports the new mode.
---

# /matcha:toggle · Toggle Matcha Governance

Toggle matcha governance state between active (enforce) and paused (off).

- If matcha is **ON** → turns **OFF** (zero overhead)
- If matcha is **OFF** → turns **ON** (all hooks active)

## Instructions for Agent
Read current state from `.agents/matcha-state.json`. If `enabled` is false, set to true with `intensity: "enforce"`. If true or absent, set `enabled: false` with `intensity: "off"`. Report the new state to user.
