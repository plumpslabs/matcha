<p align="center">
  <img src="https://raw.githubusercontent.com/plumpslabs/matcha/main/public/matcha.png" alt="🍵 matcha" width="120" />
</p>

<h1 align="center">🍵 matcha</h1>

<p align="center">
  <em>Simple. Efficient. Deliberate. Never twice.</em>
</p>

<p align="center">
  <b>Anti-bloat engineering convention for AI coding agents.</b><br />
  6 agents · 5 commands · 1 skill · 16 rule sets · 3 lifecycle hooks · 12 platforms
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" /></a>
  <a href="https://github.com/plumpslabs/matcha"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs" /></a>
  <img src="https://img.shields.io/badge/agents-6-8A2BE2" alt="6 agents" />
  <img src="https://img.shields.io/badge/rules-16-forestgreen" alt="16 rules" />
  <img src="https://img.shields.io/badge/tests-263-success" alt="251 tests" />
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
| `node bin/matcha.js status` | Show version, platform, shield status | Cloned repo |
| `node bin/matcha.js why` | 5W1H interactive check (piped input) | Cloned repo |
| `node bin/matcha.js audit` | Quick project stack audit | Cloned repo |
| `node bin/matcha.js verify` | Auto-run tests + typecheck + lint | Cloned repo |

---

## 🛡️ Hooks System

matcha ships **3 lifecycle hooks** that enforce philosophy deterministically — no prompt engineering, no guessing.

### 1. PreToolUse — `matcha-shield.js`

A deterministic safety gate that blocks dangerous commands **before** they reach the OS.

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
      "hooks": ["node hooks/matcha-shield.js"]
    }],
    "PostToolUse": [{
      "hooks": ["node hooks/matcha-post-write.js"]
    }],
    "Stop": [{
      "hooks": ["node hooks/matcha-stop.js"]
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

## Language Rules

matcha ships per-language coding standards for your tech stack:

| Language / Framework | Files | Auto-activates when editing |
|----------------------|-------|----------------------------|
| Common | `matcha-common` | Always (testing, git, conventions) |
| Redis | `matcha-redis` | All files (caching patterns) |
| Tailwind CSS | `matcha-tailwind` | `*.css`, `*.tsx`, `*.jsx`, `*.html`, `*.vue` |
| TypeScript/JS | `matcha-typescript` | `*.ts`, `*.tsx`, `*.js`, `*.jsx` |
| React | `matcha-react` | `*.tsx`, `*.jsx` |
| Next.js | `matcha-nextjs` | `*.tsx`, `*.ts` |
| TanStack | `matcha-tanstack` | `*.ts`, `*.tsx` |
| Angular | `matcha-angular` | `*.ts` |
| NestJS | `matcha-nestjs` | `*.ts` |
| Nuxt | `matcha-nuxt` | `*.vue`, `*.ts` |
| Go | `matcha-go` | `*.go` |
| Python | `matcha-python` | `*.py` |
| PHP | `matcha-php` | `*.php` |
| Java | `matcha-java` | `*.java` |
| React Native | `matcha-react-native` | `*.tsx`, `*.jsx` |

Rules are available on all platforms with adapter-specific formatting (Cursor `.mdc`, Kiro steering, Windsurf rules, etc.).

---

## Platform Adapters

matcha adapts to **12 platforms**, each with its own file format and lifecycle model.

| Platform | Files | Key Features |
|----------|-------|-------------|
| **Claude Code** | `.claude/agents/`, `.claude/commands/`, `.claude/settings.json` | 6 agents + 5 commands + 3 lifecycle hooks + skill |
| **OpenCode** | `.opencode/agents/`, `.opencode/plugins/matcha.mjs` | 6 agents + 5 commands + lifecycle plugin (`tool.execute.before`, `session.created`) |
| **Cursor** | `.cursor/rules/matcha-*.mdc` (20 files) | 4 scoped rules: **core** (alwaysApply), **cleanup** (globs), **audit** (manual), **review** (manual) + 15 language rules + 1 combined legacy |
| **Windsurf** | `.windsurfrules` (root) + `.windsurf/rules/*.md` | Root `.windsurfrules` read by Cascade AI + 16 per-language `.md` rules |
| **Kiro** | `.kiro/steering/matcha*.md` (17 files) | `inclusion: always` for core, `inclusion: manual` for dev/review modes |
| **Cline / Roo Code** | `.clinerules/matcha*.md` | Per-language `.clinerules` files |
| **OpenClaw** | `.openclaw/skills/matcha/SKILL.md` | Skill file only |
| **Qoder** | `.qoder/` | AGENTS.md + agents + rules + shield hook |
| **Qwen Code** | `.qwen/` | QWEN.md + skill + settings.json |
| **Codebuff / agy** | `.agents/` (or global) | agents + commands + rules + skill (universal format) |
| **Antigravity CLI** | `GEMINI.md` + `gemini-extension.json` | GEMINI.md convention + deprecated extension manifest |
| **Any / None** | `.agents/` (auto-created) | Universal format — agents + rules + commands + skill |

### Adapter Details

**Cursor — Scoped `.mdc` files:**
- `matcha-core.mdc` — `alwaysApply: true`, under 200 words, loaded on every request
- `matcha-cleanup.mdc` — `globs: ["**/*.{ts,tsx,js,jsx,py,go,java,php}"]`, auto-triggered on source files
- `matcha-audit.mdc` — `alwaysApply: false`, on-demand via `@matcha-auditor`
- `matcha-review.mdc` — `alwaysApply: false`, on-demand via `@matcha-reviewer`
- 15 language `.mdc` files with `globs` scoped to respective file types

**Kiro — Steering files:**
- `matcha.md` — `inclusion: always` (loaded every turn), trimmed to core rules (<200 words)
- `dev-mode.md`, `review-mode.md`, language files — `inclusion: manual` (invoked as needed)
- Uses native Kiro `inclusion` mode instead of Cursor's `alwaysApply`/`globs`

**OpenCode — Plugin with lifecycle hooks:**
- `session.created` — injects matcha system prompt every session
- `tool.execute.before` — shield enforcement for dangerous commands
- 3 slash commands: `matcha:why`, `matcha:audit`, `matcha:review`
- No `tool.execute.after` needed (cleanup handled via inline instructions)

**Antigravity CLI / Gemini:**
- `GEMINI.md` — convention file with core rules + intensity + agent list
- `gemini-extension.json` — deprecated (kept for backward compat until v3.0.0), migration guide in `GEMINI.md`

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

## ✍️ Writing Style

matcha ships a **writing style guide** (`rules/common/writing-style.md`) with 10 rules derived from matcha's own DNA — not borrowed or copied. Every rule traces back to matcha's core philosophy: Simple, Efficient, Deliberate, Never twice, 5W1H.

### The 10 Rules

| Rule | Prinsip | Domain | Deteksi Mekanis |
|------|---------|--------|----------------|
| RULE-01: Kalimat Langsung | Efficient | Commits, docs, comments | ✅ Filler phrases (`in order to`, `due to the fact that`) |
| RULE-02: Komentar = Why, Bukan What | Deliberate | Code comments | — (via agent system prompt) |
| RULE-03: Error Message Actionable | Actionable | Error messages | — (via agent system prompt) |
| RULE-04: Conventional Commits | Clean | Commit messages | ✅ Vague commit (`WIP`, `fix bug`, `update`) |
| RULE-05: Konkret, Bukan Abstrak | Never twice | All docs | — (via agent system prompt) |
| RULE-06: Aktif Voice | Simple | All docs | ✅ Passive voice (`was done`, `has been implemented`) |
| RULE-07: PR Pake 5W1H | 5W1H | PR descriptions | — (via agent system prompt) |
| RULE-08: Gak Pake Kata Mati | Simple | All docs | ✅ Buzzwords (`leverage`, `cutting-edge`, `synergy`) |
| RULE-09: Single Source of Truth | Never twice | Documentation | — (via agent system prompt) |
| RULE-10: Tone Casual-Direct | matcha tone | All communication | — (via agent system prompt) |

### Enforcement

Writing quality is enforced through **two layers**:

**Layer 1 — System prompt (soft):** The `rules/common/writing-style.md` file is auto-loaded as a common rule on all platforms. The agent reads it at session start and follows the rules during generation.

**Layer 2 — PostToolUse hook (deterministic):** The `matcha-post-write.js` hook scans modified `.md`, `.txt`, and `COMMIT_EDITMSG` files for mechanically detectable violations:

| Check | Detects | Format |
|-------|---------|--------|
| 🔵 Filler phrases | `in order to`, `due to the fact that`, `it is important to note that` | 🟢 Writing style |
| 🔵 Passive voice | `was done`, `has been implemented`, `will be processed` | 🟢 Writing style |
| 🔵 Dead buzzwords | `leverage`, `cutting-edge`, `synergy`, `paradigm shift` | 🟢 Writing style |
| 🔵 Vague commit | `fix bug`, `WIP`, `update`, `changes` (on COMMIT_EDITMSG only) | 🟢 Writing style |

### Filosofi

Writing rules ini bukan copy-paste dari project lain. Setiap rule lahir dari DNA matcha:

- **RULE-01** (Kalimat Langsung) ← Efficient: filler = bloat, sama kayak code bloat
- **RULE-02** (Komentar = Why) ← Deliberate: code = what, comment = why
- **RULE-06** (Aktif Voice) ← Simple: lebih pendek, lebih jelas
- **RULE-09** (Single Source of Truth) ← Never twice: informasi juga gak boleh duplikat
- **RULE-07** (PR Pake 5W1H) ← 5W1H: sama kayak checkpoint Purpose

Tone: **casual-direct dengan sarkas ringan**. Bukan formal kaku (bukan "Dear Sir/Madam"), bukan terlalu informal (bukan "yo dude"). Target: ngobrol sama senior engineer yang lo hormati.

### Scope

| Domain | Berlaku | Enforcement |
|--------|---------|-------------|
| Commit messages | ✅ | PostToolUse hook + system prompt |
| Code comments | ✅ | System prompt |
| PR descriptions | ✅ | System prompt |
| Error messages | ✅ | System prompt |
| README/docs | ✅ | PostToolUse hook + system prompt |
| External documentation | ❌ (pake judgment) | — |
| Regulatory/compliance | ❌ (pake judgment) | — |

---

## CLI (from cloned repo)

```
node bin/matcha.js status      Show version, platform, components
node bin/matcha.js why          5W1H interactive check (piped input supported)
node bin/matcha.js audit        Quick project stack audit
node bin/matcha.js verify       Auto-detect + run tests, typecheck, lint
node bin/matcha.js help         Show usage
```

Supports: npm test, jest, vitest, pytest, go test, cargo test, phpunit, mvn test, gradle test, make test.

Install via:
```bash
curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
```

---

## Project Structure

```
matcha/
├── bin/matcha.js                  ← CLI (node bin/matcha.js)
├── install.sh                     ← 1-script installer (12 platforms)
├── QUICKSTART.md / QWEN.md        ← quick start / Qwen template
├── AGENTS.md / CLAUDE.md          ← context / persona files
├── GEMINI.md                      ← Antigravity CLI convention
├── .windsurfrules                 ← Windsurf Cascade AI rules (root)
│
├── rules/                         ← canonical language rules (6 langs)
│   ├── typescript/                ← React, Next.js, Angular, NestJS, Nuxt, TanStack
│   ├── common/                    ← Redis, Tailwind, coding-standards, testing, git, writing-style
│   ├── go/                        ← Go coding standards + patterns
│   ├── python/                    ← Python coding standards + patterns
│   ├── java/                      ← Java coding standards + patterns
│   ├── php/                       ← PHP coding standards + patterns
│   └── react-native/              ← React Native coding standards + patterns
│
├── skills/matcha/SKILL.md         ← philosophy + 6 checkpoints + feedback harness
├── commands/                      ← 5 canonical slash commands
│
├── hooks/                         ← lifecycle hooks system
│   ├── matcha-shield.js           ← PreToolUse: safety gate (dangerous commands)
│   ├── matcha-post-write.js       ← PostToolUse: cleanup enforcement (debug/TODO/catch/creds)
│   ├── matcha-stop.js             ← Stop event: deterministic end-of-task tips (git diff)
│   ├── inject-rules.js            ← Pre-task: inject matcha philosophy
│   ├── matcha-instructions.js     ← Shared instruction builder (single source of truth)
│   └── hooks.json                 ← Universal hook manifest
│
├── benchmark/
│   └── matcha-bench.js            ← Compliance benchmark tool (npm run benchmark)
│
├── tests/index.js                 ← 251 tests (syntax + content + shield + hooks + adapters + writing)
│
├── .claude/                       ← Claude Code (agents + commands + skills + settings.json)
├── .opencode/                     ← OpenCode (agents + commands + plugin matcha.mjs)
├── .cursor/rules/                 ← Cursor (19 .mdc files — 4 scoped + 15 language)
├── .windsurf/rules/               ← Windsurf (16 .md files)
├── .clinerules/                   ← Cline / Roo Code (per-language rules)
├── .agents/                       ← Codebuff / agy (universal format)
│   ├── agents/                    ← 6 agents
│   ├── commands/                  ← 5 commands
│   ├── rules/                     ← 16 rules
│   └── skills/matcha/SKILL.md
├── .kiro/steering/                ← Kiro (17 files — inclusion: always/manual)
├── .openclaw/skills/matcha/       ← OpenClaw (SKILL.md)
├── .qoder/                        ← Qoder (agents + rules + hooks)
├── .qwen/                         ← Qwen Code (skill + settings.json + QWEN.md)
├── .claude-plugin/                ← Claude Code marketplace plugin
├── gemini-extension.json          ← Antigravity CLI (deprecated, see GEMINI.md)
├── package.json                   ← npm scripts: test, build, check, benchmark
└── .github/workflows/publish.yaml ← CI/CD
```

---

## Development

```bash
npm test              # 249+ tests
npm run build         # sync rules to .openclaw/
npm run check         # verify rule copies are in sync
npm run build:check   # build + check
npm run benchmark     # compliance self-benchmark
```

---

## License

MIT © [plumpslabs](https://github.com/plumpslabs)
