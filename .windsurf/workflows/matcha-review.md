---
description: Trigger blocking matcha review gate (L0–L3)
---

# matcha review

Run the matcha review gate on the current change.

Triggers `@matcha-reviewer`. Auto-routes by blast radius: L0 (docs) → L1 (lint) → L2 (full review) → L3 (expert + threat model).
