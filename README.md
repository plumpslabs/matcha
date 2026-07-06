<p align="center">
  <img src="https://raw.githubusercontent.com/plumpslabs/matcha/main/public/matcha.png" alt="🍵 matcha" width="170" />
</p>

<h1 align="center">🍵 matcha</h1>

<p align="center">
  <em>Simple. Efficient. Deliberate. Never twice.</em>
</p>

<p align="center">
  <b>Anti-bloat engineering convention for AI coding agents.</b><br />
  6 agents · 6 commands · 3 lifecycle hooks
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" /></a>
  <a href="https://github.com/plumpslabs/matcha"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs" /></a>
  <img src="https://img.shields.io/badge/agents-6-8A2BE2" alt="6 agents" />

  <img src="https://img.shields.io/badge/tests-316-success" alt="316 tests" />
</p>

---

## Why matcha?

Every AI coding session starts the same: jump in, write code, realize mid-way you missed something obvious. matcha is a **6-checkpoint filter** that runs before, during, and after every implementation — catching the things you'd catch yourself if you stopped to think.

No bloat. Just a deliberate gate between you and messy code.

---

## Quick Setup

**Three ways to install:**

<table>
  <tr><th>Method</th><th>Works on</th><th>Command</th></tr>
  <tr>
    <td><code>curl | bash</code></td>
    <td>Any AI agent (auto-detects 12 platforms)</td>
    <td><pre>curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash</pre></td>
  </tr>
  <tr>
    <td><code>/plugin marketplace</code></td>
    <td>Claude Code only</td>
    <td><pre>/plugin marketplace add https://github.com/plumpslabs/matcha
/plugin install matcha@plumpslabs-matcha</pre></td>
  </tr>
  <tr>
    <td><code>agy plugin</code></td>
    <td>Antigravity CLI</td>
    <td><pre>agy plugin install https://github.com/plumpslabs/matcha</pre></td>
  </tr>
</table>

See [QUICKSTART.md](QUICKSTART.md) for the full 5-minute guide.

---

## The 6-Checkpoint Filter

Every implementation passes through these gates:

```
🎯 Purpose  →  🔎 Reuse  →  🔍 Stack  →  🛠️ Implementation  →  🧹 Cleanup  →  ✅ Verify
```

| # | Checkpoint | What it enforces |
|---|------------|------------------|
| 🎯 | **Purpose** | 5W1H — What/Why/Who/When/Where/How. Can't answer Why/How? → STOP. |
| 🔎 | **Reuse** | Before writing: search codebase for existing implementations. Never write what already exists. |
| 🔍 | **Stack** | Scan manifests, services, deps. Overlap found? → STOP. Report. |
| 🛠️ | **Implementation** | No hardcode. Explicit errors. One function. "Is there a simpler path?" |
| 🧹 | **Cleanup** | Done = working AND clean. Temp files, debug code, unused imports. Decision log. |
| ✅ | **Verify** | Auto-detect + run tests, typecheck, lint. Tests fail? → STOP and fix first. |

---

## Philosophy

matcha enforces **universal engineering principles** — language-agnostic, framework-agnostic, team-agnostic. Every rule traces back to one of these core ideas:

| Principle | What it means | Applied in |
|-----------|---------------|------------|
| **Type-safe by default** | No escape hatches, no `any` casting. Let the type system work for you. | Implementation checkpoint |
| **CQS** | Commands change state (return void). Queries return data (no side effects). Never both. | Implementation checkpoint |
| **Idempotency** | Mutations must be retry-safe. Use idempotency keys for payments, webhooks, and critical writes. | Implementation checkpoint |
| **Validate at boundaries** | Validate inputs at the outer layer (controller/handler), not deep in service logic. Fail before mutation, not after partial write. | Implementation checkpoint |
| **Contract-first** | Draft response shape / component props / API contract before implementation. No contract = no code. | Checkpoint 1 (5W1H) |
| **Observability** | Structured logging, no `console.log`. Every log line should be parsable and actionable. | PostToolUse hook |
| **Pure functions first** | Side effects at boundaries. Business logic should be pure — testable without mocks. | Implementation checkpoint |
| **Fail fast** | Validate config at startup, not at first use. Catch misconfig before it reaches production. | Config validation |
| **Performance awareness** | Watch for N+1 queries, O(n²+) loops, and unnecessary allocations in hot paths. | PostToolUse hook |

### Companion Tools

matcha pairs naturally with other tools from the same ecosystem:

- 🐻 **[Kuma](https://github.com/plumpslabs/kuma)** — Runtime safety enforcement. MCP server that blocks dangerous operations before they execute. Complements matcha-shield. Use when handling sensitive data or production infrastructure.
- 🦊 **[Fennec](https://github.com/plumpslabs/fennec)** — AI-native developer observability. MCP server that gives AI agents browser, terminal, and process visibility. Complements matcha's debugging and review checkpoints.

Together they form a complete stack: **matcha 🍵** (philosophy) + **kuma 🐻** (safety) + **fennec 🦊** (observability).

---

## Agents

| Agent | Checkpoint | Tools | When to use |
|-------|-----------|-------|-------------|
| `matcha-planner` | 🎯 Purpose | Read Grep Glob | Before starting features, refactoring, architecture (plan only, no exec) |
| `matcha-finder` | 🔎 Reuse | Read Grep Glob Bash | Before writing any new code — reuse hunter |
| `matcha-auditor` | 🔍 Stack | Read Grep Glob Bash | Stack audits, service overlap, health checks |
| `matcha-reviewer` | 🛠️ + 🧹 + ✅ | Read Grep Glob | Post-implementation review + verify tests passed |
| `matcha-cleaner` | 🧹 Cleanup | Read Grep Glob Bash | Temp removal, debug code, unused imports |
| `matcha-debugger` | 🎯 → ✅ (full) | Read Grep Glob Bash | Systematic debugging — one hypothesis at a time |

Invoke: `@matcha-reviewer` or let the agent auto-route via description.

---

## Slash Commands

| Command | Description | Where |
|---------|-------------|-------|
| `/matcha:why` | 5W1H check before starting a task | Claude, OpenCode |
| `/matcha:review` | Post-implementation review | Claude, OpenCode |
| `/matcha:audit` | Stack audit for overlaps & inefficiencies | Claude, OpenCode |
| `/matcha:observe\|enforce\|audit` | Set intensity level | Claude, OpenCode |
| `/matcha:status` | Session health + component availability | Claude, OpenCode |
| `/matcha:debt` | Technical debt from decision logs | Claude, OpenCode |

---

## 🛡️ Hooks System

matcha ships **3 lifecycle hooks** that enforce philosophy deterministically — no prompt engineering, no guessing.

### 1. PreToolUse — `matcha-shield.js`

A deterministic safety gate that:
1. **Blocks codebase modifications/commands before planning**: In `enforce` (default) and `audit` modes, it blocks all write/edit tools and terminal execution commands until you create/update the 5W1H plan in `.agents/matcha-plan.md` (using a valid `<matcha_gate>` XML block with at least 15 characters per section).
2. **Blocks dangerous commands before they reach the OS**:

| Blocked | Example |
|---------|---------|
| Root filesystem deletion | `rm -rf /`, `rm -rf ~`, `rm -rf .` |
| Permission abuse | `chmod 777` |
| Destructive git | `git push --force` |
| Database destruction | `DROP DATABASE`, `TRUNCATE TABLE` |
| Remote code execution | `curl \| bash`, `wget \| sh` |
| Disk corruption | Write to `/dev/sda`, `mkfs`, `dd` to block device |
| System commands | `shutdown`, `reboot`, `init 0` |

**Override:** `MATCHA_SHIELD_OFF=true` (not recommended)

**Architecture:**
- **CLI mode** — invoked by Claude Code PreToolUse hook, reads event from stdin, exits code 2 to block
- **Programmatic API** — ESM export via `beforeToolUse(event, context)` for use in other platforms

**Platform support:**

| Platform | Integration |
|----------|-------------|
| Claude Code | `.claude/settings.json` — PreToolUse hook |
| OpenCode | `tool.execute.before` in `matcha.mjs` plugin |
| Qoder | `hooks.json` — `before:tool_use` event |
| Antigravity | `gemini-extension.json` — tool lifecycle |

**Dual-mode:** Works both as a Claude Code hook (stdin/stdout) and programmatic API (ESM import).

### 2. PostToolUse — `matcha-post-write.js`

Automatically scans **modified files** after every Write/Edit for cleanup issues and returns `additionalContext` so the agent can self-correct.

| Severity | Check | Pattern |
|----------|-------|---------|
| 🔴 **Critical** | Empty catch block | Error silently swallowed |
| 🔴 **Critical** | Hardcoded credential | API key/secret/password/token |
| 🟡 **Minor** | Debug log/statement | `console.log`, `print()`, `debugger` |
| 🟡 **Minor** | TODO/FIXME | Unfinished work left in code |
| 🟡 **Minor** | Unbounded query | `SELECT` without `LIMIT` |
| 🟡 **Minor** | High OFFSET | Consider cursor pagination |
| 🟡 **Minor** | Function in WHERE | `YEAR()`, `MONTH()`, `LOWER()` — index won't be used |

**How it works:**
1. After Write/Edit tool completes, hook fires
2. Scans the modified file for 4 check types
3. If issues found → injects `additionalContext` into agent's reasoning chain
4. If clean → silent exit (zero overhead)

### 3. Stop — `matcha-stop.js`

Replaces the old prompt-based "surface 3 tips" instruction with a **deterministic** stop event hook that scans git diff for real issues.

| Tip | Scan | Trigger |
|-----|------|---------|
| ⚡ **Efficiency** | Debug code, empty catches, oversized functions | `git diff --unified=0` |
| 🔎 **Reuse** | New functions count, import density | `git diff --diff-filter=AM` |
| 🧹 **Cleanup** | Untracked files, temp artifacts | `git status --porcelain` |

**Why deterministic:**
- Old approach: "include 3 tips at the end" → LLM guesswork, inconsistent
- New approach: scan actual git diff → factual tips every time

**Platform fallback:** For platforms without hook support (OpenCode), an inline End-of-Task checklist is injected via `session.created` system prompt.

**Hook registration** (`.claude/settings.json`):
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/matcha-shield.js",
        "timeout": 5000
      }]
    }],
    "PostToolUse": [{
      "hooks": [{
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/matcha-post-write.js",
        "timeout": 3000
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/matcha-stop.js",
        "timeout": 5000
      }]
    }]
  }
}
```

---

## Benchmarks

matcha ships with two benchmark modes:

### ⚖️ Compliance Score

Scans your project for matcha compliance issues:

```
Usage:
  node benchmark/matcha-bench.js            ← scan current dir
  node benchmark/matcha-bench.js ./src      ← scan specific dir
  node benchmark/matcha-bench.js --json     ← JSON output
  npm run benchmark                         ← via npm script
  npm run benchmark:json                    ← JSON via npm script
```

**Scoring:**
- **A+ (95-100):** Excellent — matcha compliant
- **A (85-94):** Good — minor issues
- **B (70-84):** Needs attention
- **C (50-69):** Poor — needs cleanup
- **F (0-49):** Critical — major cleanup required

**Checks:** Debug logs, TODO/FIXME, empty catch blocks, hardcoded credentials, hardcoded URLs.

**Baseline comparison:** `node benchmark/matcha-bench.js --json --baseline baseline.json`

### 🤖 Agentic Benchmark

Two modes:

**Static A/B/C** — compares pre-written solutions for baseline, terse, and matcha:

```bash
node benchmark/matcha-bench.js --agentic
node benchmark/matcha-bench.js --agentic --json   # JSON output
```

**Live A/B/C** — spawns real Claude Code sessions for each arm (requires [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/overview)):

```bash
# Full live run — spawns Claude Code for each task × arm
node benchmark/agentic-runner.js

# Simulated mode (uses default solutions, no Claude needed)
node benchmark/agentic-runner.js --simulate

# Single arm or task
node benchmark/agentic-runner.js --arm matcha
node benchmark/agentic-runner.js --task email-validator

# Keep temp directories for inspection
node benchmark/agentic-runner.js --keep

# Also accessible via matcha-bench.js
node benchmark/matcha-bench.js --agentic-live
node benchmark/matcha-bench.js --agentic-live --simulate
```

**How it works:**
1. For each task, creates an isolated temp directory
2. Writes the task specification as a prompt file
3. **matcha arm** — injects `.claude/CLAUDE.md` with core matcha rules into the temp project
4. Spawns `claude --print` with the spec as input
5. Waits for `solution.js` to be generated (120s timeout)
6. Runs the task's `test.js` against the generated solution
7. Measures LOC, tracks correctness, cleans up

**Arms:**

| Arm | Description | Purpose |
|-----|-------------|---------|
| **baseline** | Standard implementation | Control — no conventions |
| **terse** | Just "be brief" | Control — mere brevity vs structural rules |
| **matcha** | Full matcha conventions | Test subject |

**Scoring per task:**
- ✅ **Correctness gate** — output matches expected results
- 🛡️ **Adversarial gate** — handles edge cases (null, empty, type mismatches) without crashing
- 📐 **LOC & tokens** — code volume comparison across all 3 arms

**Tasks (7 total):**
| Type | Tasks | What it tests |
|------|-------|---------------|
| 🧪 **Surgical** | Email validator, Debounce, CSV sum, FizzBuzz, Array flatten | Single-function precision — does matcha reduce code without breaking correctness? |
| 🏗️ **Over-build** | Date formatter, Log level filter | Real feature tickets that tempt over-engineering — does matcha prevent unnecessary abstractions? |

The **terse arm** is the key control: if matcha beats terse on correctness + adversarial while using less code, it proves **matcha rules work** — the improvement isn't just because the agent writes shorter code.

```
Sample output:
── Email Validator ──
  ✅ baseline   12 LOC, ~ 53 tok
  ✅ terse       4 LOC, ~ 35 tok  (-8 LOC, -17%)
  ✅ matcha      3 LOC, ~ 30 tok  (-9 LOC, -19%)  🛡️

═══ Summary ═══
                  baseline    terse    matcha
Total LOC:             52       37        27
Total tok:            ~278     ~187      ~158
Correct:              5/7      5/7       5/7
Adversarial:          5/7      5/7       7/7

  📐 matcha vs baseline: -25 LOC (-48%)
  📐 terse  vs baseline: -15 LOC (-29%)
  🎯 matcha beats terse by 10 LOC — rules > mere brevity
```

---

## Platform Adapters

matcha adapts your conventions to each AI coding platform's native format.

| Platform | Integration |
|----------|-------------|
| **Claude Code** | `.claude/` — agents + commands + 3 lifecycle hooks (shield, post-write, stop) |
| **OpenCode** | `.opencode/` — plugin + agents + skills |
| **Kiro** | `.kiro/steering/` — matcha.md, dev-mode.md, review-mode.md |
| **OpenClaw** | `.openclaw/skills/matcha/SKILL.md` |
| **Windsurf** | `.windsurfrules` (root) |
| **Antigravity CLI** | `GEMINI.md` |
| **Any / None** | `.agents/` (auto-created) — universal format |

---

## Intensity Levels

| Level | Behavior |
|-------|----------|
| **observe** | Tips only. No blocking. |
| **enforce** | Full 6-checkpoint filter. **Default.** |
| **audit** | Enforce + mandatory cleanup. Everything flagged. |

Set with `/matcha:audit` or `/matcha:observe` in supported platforms.

---

## Communication

When matcha flags something:

```
🍵 matcha: [TITLE]

Observation: [what was found]
Why it matters: [impact]
Options:
  A) [option] — [trade-off]
  B) [option] — [trade-off]

Recommendation: [which and why]
```

---



## CLI (from cloned repo)

```
node bin/matcha.js status      Show version, platform, components
node bin/matcha.js init         Install matcha to current directory
node bin/matcha.js help         Show usage
```

Install via:
```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

## Contributing

Contributions are welcome! If you want to add support for a new platform, update language guidelines, or run local benchmarks and tests, please see our [CONTRIBUTING.md](file:///home/mawa/My_File/Development/matcha/CONTRIBUTING.md) guide.

---

## License

MIT © [plumpslabs](https://github.com/plumpslabs)
