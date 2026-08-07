---
name: kuma-mcp
description: Kuma MCP — context, memory & safety for AI coding agents. Standalone-first; matcha integration optional.
---

# Kuma MCP — 6 Core Actions

Kuma works standalone in any agent. Record what matters, skip what doesn't.

## 🧠 `kuma_context` — Context & Recall
- **init** (CALL FIRST each session): `kuma_context({ action: "init" })` — project brief + session state
- **research** (before unfamiliar code): `kuma_context({ action: "research", scope: "<area>" })`
- **history** (why is this file written this way): `kuma_context({ action: "history", target: "<file>" })`

## 💾 `kuma_memory` — Persistent Knowledge
- **gotcha** (IMMEDIATELY on bug/quirk): `kuma_memory({ action: "gotcha", scope: "<file>", content: "<bug>", status: "medium" })`
- **decision** (chose between options): `kuma_memory({ action: "decision", title: "<title>", rationale: "<why>" })`
- **arch_flow** (traced a flow, max 5 files): `kuma_memory({ action: "arch_flow", content: "domain: <Name> | hops: <file1> → <file2>" })`

## 🛡️ `kuma_safety` — Safety & Verification
- **guard** (before risky work): `kuma_safety({ action: "guard", guardGoal: "<goal>" })`
- **verify** (after edits): `kuma_safety({ action: "verify", scope: "<area>" })`

## Workflow
1. Session start → `kuma_context({ action: "init" })`
2. Unfamiliar code → `kuma_context({ action: "research" })`
3. Edit using native tools
4. Bug / choice / flow → `kuma_memory({ action: "gotcha" | "decision" | "arch_flow" })`
5. After edits → `kuma_safety({ action: "verify" })`

> 🐻 Matcha is optional: matcha enforces planning/review gates, Kuma supplies memory & context. Either works alone.
