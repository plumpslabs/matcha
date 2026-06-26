<p align="center">
  <img src="https://raw.githubusercontent.com/plumpslabs/matcha/main/public/matcha.png" alt="🍵 matcha" width="120" />
</p>

<h1 align="center">🍵 matcha</h1>

<p align="center">
  <em>Simple. Efficient. Deliberate. Never twice.</em>
</p>

<p align="center">
  <b>Anti-bloat engineering convention for AI coding agents.</b><br />
  6 agents · 5 commands · 1 skill · 16 rule sets · 10 platforms
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" /></a>
  <a href="https://github.com/plumpslabs/matcha"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs" /></a>
  <img src="https://img.shields.io/badge/agents-6-8A2BE2" alt="6 agents" />
  <img src="https://img.shields.io/badge/rules-16-forestgreen" alt="16 rules" />
</p>

---

## Why matcha?

Every AI coding session starts the same: jump in, write code, realize mid-way you missed something obvious. matcha is a **5-checkpoint filter** that runs before, during, and after every implementation — catching the things you'd catch yourself if you stopped to think.

No bloat. Just a deliberate gate between you and messy code.

---

## Quick Setup

**Two ways to install:**

<table>
  <tr><th>Method</th><th>Works on</th><th>Command</th></tr>
  <tr>
    <td><code>curl \| bash</code></td>
    <td>Any AI agent</td>
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

## The 5-Checkpoint Filter

Every implementation passes through these gates:

```
🎯 Purpose  →  🔎 Reuse  →  🔍 Stack  →  🛠️ Implementation  →  🧹 Cleanup
```

| # | Checkpoint | What it enforces |
|---|------------|------------------|
| 🎯 | **Purpose** | 5W1H — What/Why/Who/When/Where/How. Can't answer Why/How? → STOP. |
| 🔎 | **Reuse** | Before writing: search codebase for existing implementations. Never write what already exists. |
| 🔍 | **Stack** | Scan manifests, services, deps. Overlap found? → STOP. Report. |
| 🛠️ | **Implementation** | No hardcode. Explicit errors. One function. "Is there a simpler path?" |
| 🧹 | **Cleanup** | Done = working AND clean. Temp files, debug code, unused imports. Decision log. |

---

## Agents

| Agent | Checkpoint | Tools | When to use |
|-------|-----------|-------|-------------|
| `matcha-planner` | 🎯 Purpose | Read Grep Glob Bash | Before starting features, refactoring, architecture |
| `matcha-finder` | 🔎 Reuse | Read Grep Glob Bash | Before writing any new code — reuse hunter |
| `matcha-auditor` | 🔍 Stack | Read Grep Glob Bash | Stack audits, service overlap, health checks |
| `matcha-reviewer` | 🛠️ + 🧹 | Read Grep Glob | Post-implementation review, PR review |
| `matcha-cleaner` | 🧹 Cleanup | Read Grep Glob Bash | Temp removal, debug code, unused imports |
| `matcha-debugger` | 🎯 → 🧹 (full) | Read Grep Glob Bash | Systematic debugging — no guessing |

Invoke: `@matcha-reviewer` or let Claude auto-route via description.

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/matcha:why` | 5W1H check before starting a task |
| `/matcha:review` | Post-implementation review |
| `/matcha:audit` | Stack audit for overlaps & inefficiencies |
| `/matcha:observe\|enforce\|audit` | Set intensity level |
| `/matcha:status` | Session health + component availability |

Available on: Claude Code, OpenCode. Skill-based platforms (Antigravity/agy) get matcha as a skill via `.agents/skills/`. Instruction-only platforms (Cursor, Windsurf, Cline, Kiro) get the always-on ruleset instead.

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

Rules are available on all platforms (Cursor `.mdc`, Kiro steering, Claude rules, etc.).

---

## Supported Platforms

| Platform | Method | Files |
|----------|--------|-------|
| Claude Code | Agents + Commands + Rules + Plugin | `.claude/`, `CLAUDE.md` |
| Codex | Context | `AGENTS.md` |
| OpenCode | Agents + Commands + Plugin | `.opencode/` |
| Antigravity (agy) | Skills + Context | `.agents/skills/`, `AGENTS.md` |
| Cursor | Rules | `.cursor/rules/*.mdc` |
| Windsurf | Rules | `.windsurf/rules/*.md` |
| Cline | Rules | `.clinerules/*.md` |
| Kiro | Steering | `.kiro/steering/*.md` |
| OpenClaw | Skills | `.openclaw/skills/matcha/` |
| Agentic IDE | Rules + MCP + Skills | `.agents/rules/`, `.agents/skills/` |

---

## Intensity Levels

| Level | Behavior |
|-------|----------|
| **observe** | Tips only. No blocking. |
| **enforce** | Full 5-checkpoint filter. **Default.** |
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

## Project Structure

```
matcha/
├── install.sh                    ← 1-script installer
├── rules/                        ← canonical language rules (6 langs)
├── skills/matcha/SKILL.md        ← philosophy (canonical)
├── commands/                     ← 5 slash commands
├── hooks/                        ← lifecycle hooks
├── .claude/                      ← Claude Code (agents + commands + skills)
├── .opencode/                    ← OpenCode (agents + commands + skills + plugin)
├── .cursor/rules/                ← Cursor (.mdc rules)
├── .agents/rules/                ← Agentic IDE
├── .clinerules/                  ← Cline (symlinks)
├── .windsurf/rules/              ← Windsurf (symlinks)
├── .kiro/steering/               ← Kiro (auto + manual modes)
├── .openclaw/skills/             ← OpenClaw
├── .claude-plugin/               ← Claude Code plugin manifest
├── gemini-extension.json         ← Antigravity CLI plugin manifest
├── AGENTS.md / CLAUDE.md         ← context files
├── QUICKSTART.md                 ← 5-minute setup
└── ai-agent-guide.md             ← full reference guide
```

---

## License

MIT © [plumpslabs](https://github.com/plumpslabs)
