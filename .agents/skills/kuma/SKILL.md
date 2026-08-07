---
name: kuma-mcp
description: Kuma safety toolkit for AI coding agents. Research with kuma_context, record knowledge with kuma_memory, verify safety with kuma_safety.
---

# Kuma MCP — AI Agent Usage Guidelines

Kuma MCP is a safety-first context & shadow memory engine. It provides **3 coarse-grained tools**:

## 🧠 `kuma_context` — Context & Research
- **init:** `kuma_context({ action: "init" })` — Load lean project brief + session memory (**CALL FIRST** if available)
- **research:** `kuma_context({ action: "research", scope: "<path>" })` — Run 5-step research pipeline before editing unfamiliar code
- **history:** `kuma_context({ action: "history", target: "<file>" })` — Trace cross-session history & rationale for a file
- **changes:** `kuma_context({ action: "changes" })` — Review modified files in current session

## 💾 `kuma_memory` — Decision & Knowledge
- **gotcha:** `kuma_memory({ action: "gotcha", scope: "<file>", content: "<bug/quirk>", status: "medium" })` — Record bugs/quirks IMMEDIATELY
- **arch_flow:** `kuma_memory({ action: "arch_flow", content: "domain: <Name> | hops: <file1> → <file2>" })` — Record architecture flow (max 5 core files)
- **decision:** `kuma_memory({ action: "decision", title: "<title>", rationale: "<rationale>" })` — Record ADR-style decisions

## 🛡️ `kuma_safety` — Safety & Verification
- **guard:** `kuma_safety({ action: "guard", guardGoal: "<goal>" })` — Pre-execution anti-pattern & runaway loop check
- **verify:** `kuma_safety({ action: "verify", scope: "<area>" })` — Auto-run scoped verification after edits

## Workflow Pattern (Matcha + Kuma Combo)
1. Task start → `kuma_context({ action: "init" })`
2. Unfamiliar code → `kuma_context({ action: "research" })`
3. Edit code using native tools
4. Found bug/decision → `kuma_memory({ action: "gotcha" | "decision" })`
5. Finish → `kuma_safety({ action: "verify" })`