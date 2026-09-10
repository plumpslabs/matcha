# 🍵 matcha — Antigravity CLI Convention

> **Full ruleset:** `AGENTS.md` (at project root) — read it before acting.

This project uses the **matcha** engineering philosophy for Antigravity CLI and all AI agent providers.

**Core rule #0 — ⚖️ Proportionality:** Match ceremony to task size. Trivial ≤5 LOC → fast pass. Large/cross-cutting → full gate. Planning > implementation = over-planning.

## Governance Switch

Check `.matcha-state.json` before each turn:
- `enabled: true` (default) → full matcha lifecycle active
- `enabled: false` → **ALL hooks are OFF** — no gates, no scans, no tips, zero overhead

## Quick Reference

| Mode | Command | Effect |
|------|---------|--------|
| On | `matcha on` | All guardrails active |
| Off | `matcha off` | Completely silent |
| Toggle | `matcha toggle` | Flip current state |
| Status | `matcha status` | Show current state |

## Agents

@matcha-planner · @matcha-finder · @matcha-auditor · @matcha-reviewer · @matcha-cleaner · @matcha-debugger

## Intensity

- **observe** — tips only
- **enforce** — full checkpoints (default)
- **audit** — enforce + mandatory cleanup

> 🔒 Full rules, 6-checkpoint filter, industrial scaling protocols, session memory, and companion ecosystem (Kuma/Fennec) → **`AGENTS.md`**
