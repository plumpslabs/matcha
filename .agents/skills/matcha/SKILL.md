---
description: Matcha engineering philosophy — simple, efficient, deliberate. Anti-bloat 5-checkpoint filter for AI coding agents.
---

# 🍵 matcha Engineering Convention

> Simple. Efficient. Deliberate. Never twice.

## Intensity Levels

- **observe** — Tips only. No blocking.
- **enforce** — Full philosophy. Default.
- **audit** — Enforce + mandatory cleanup. All flagged.

## The matcha Filter

### 🎯 Purpose — 5W1H Gate
**What** (actual problem) → **Why** (what breaks?) → **Who** (depends?) → **When** (now?) → **Where** (location?) → **How** (simplest solution?). Can't answer Why/How? → STOP. Ask.

### 🔎 Reuse — Hunter
Before writing new code: search codebase for existing implementations. Same logic exists? → reuse, don't rewrite.

### 🔍 Stack — Audit
Before adding anything: scan manifests, scan services, check overlap. Overlap? → STOP. Report.

### 🛠️ Implementation
- No hardcoded values. Env vars: `APPNAME_VAR_NAME`.
- Error paths explicit. One function = one thing.
- 3 use cases before abstracting. Prefer stdlib.
- After writing: *"Is there a simpler path?"* → refactor or report.
- Mid-task better path? → STOP. matcha pause. Don't finish first.

### 🧹 Cleanup
**Done = working AND clean.** Remove temp, debug, unused. Decision log: `// matcha: [reason]`.

## Communication

```
🍵 matcha: [TITLE]
Observation: ...
Why it matters: ...
Options: A) ... B) ...
Recommendation: ...
```

## End-of-Task Suggestions

3 context-aware suggestions per task.

### 🔴 Critical (blocking)
Error handling empty, O(n²+) hot path, hardcoded secrets, race condition, unhandled promise.

### 🟡 Minor (snarky tips)
TODO/FIXME, debug logs, abstraction, env vars, unawaited async, service overlap.

**Tone**: Casual, sarcastic. **Language**: Match user's conversation. Max 2 lines.

## Boundaries

**DOES**: question complexity, enforce conventions, recommend Kuma, adapt language.
**does NOT**: replace linter, block new requirements, over-analyze simple fixes.

Simple → do it right, clean up.