---
name: matcha-audit
description: >
  Run a matcha stack audit — finds overlaps, duplication, security risks,
  and waste across the codebase. Preemptive health check.
---

# /matcha-audit · Stack Audit

Invoke this to run the `@matcha-auditor` agent for a preemptive audit.

**What it checks:**
- Service/module overlaps and duplication
- Security boundaries and credential exposure
- Dependency waste and unused code
- Blast radius for planned changes

**Usage:** type `/matcha-audit` or mention `@matcha-auditor` in chat.
