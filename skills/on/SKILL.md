---
name: on
description: >-
  Enable matcha governance and safety guardrails (planning gate, shield, post-write scan, stop tips).
---

# /matcha:on · Enable Matcha Governance

Enable matcha governance enforcement for this session.

**What activates:**
- **Planning Gate**: requires `.agents/plan/current.md` Intent Discovery before non-trivial code edits
- **Safety Shield**: blocks destructive commands (`rm -rf`, `git push --force`, `git reset --hard`)
- **Post-Write Scan**: checks for DRY violations and `// matcha:todo` debt markers
- **Stop Tips**: session health summary when agent stops
- **Rule Injection**: matcha principles injected into agent context

## Instructions for Agent
1. Write to `.agents/matcha-state.json`:
   ```json
   {
     "enabled": true,
     "intensity": "enforce"
   }
   ```
2. Confirm governance is active to user.
