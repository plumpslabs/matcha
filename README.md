<p align="center">
  <img src="https://raw.githubusercontent.com/plumpslabs/matcha/main/public/matcha.png" alt="🍵 matcha" width="120" />
</p>

<h1 align="center">🍵 matcha</h1>

<p align="center">
  <em>Simple. Efficient. Deliberate. Never twice.</em>
</p>

<p align="center">
  <b>Anti-bloat engineering convention for AI coding agents.</b><br />
  6 agents · 5 commands · 1 skill · 16 rule sets · 12 platforms
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
| Agent | Checkpoint | Tools | When to use |
|-------|-----------|-------|-------------|
| `matcha-planner` | 🎯 Purpose | Read Grep Glob | Before starting features, refactoring, architecture (plan only, no exec) |
| `matcha-finder` | 🔎 Reuse | Read Grep Glob Bash | Before writing any new code — reuse hunter |
| `matcha-auditor` | 🔍 Stack | Read Grep Glob Bash | Stack audits, service overlap, health checks |
| `matcha-reviewer` | 🛠️ + 🧹 + ✅ | Read Grep Glob | Post-implementation review + verify tests passed |
| `matcha-cleaner` | 🧹 Cleanup | Read Grep Glob Bash | Temp removal, debug code, unused imports |
| `matcha-debugger` | 🎯 → ✅ (full) | Read Grep Glob Bash | Systematic debugging — one hypothesis at a time |

Invoke: `@matcha-reviewer` or let Claude auto-route via description.

---

## Slash Commands

| Command | Description |
|---------|-------------|
| Command | Description | Where |
|---------|-------------|-------|
| `/matcha:why` | 5W1H check before starting a task | Claude, OpenCode |
| `/matcha:review` | Post-implementation review | Claude, OpenCode |
| `/matcha:audit` | Stack audit for overlaps & inefficiencies | Claude, OpenCode |
| `/matcha:observe\|enforce\|audit` | Set intensity level | Claude, OpenCode |
| `/matcha:status` | Session health + component availability | Claude, OpenCode |
| `npx matcha init` | Install matcha to project | Any (npm) |
| `npx matcha status` | Show version, platform, shield status | Any (npm) |
| `npx matcha why` | 5W1H interactive check (piped input) | Any (npm) |
| `npx matcha audit` | Quick project stack audit | Any (npm) |
| `npx matcha verify` | Auto-run tests + typecheck + lint | Any (npm) |

Slash commands available on Claude Code, OpenCode. npx commands available wherever Node.js is installed.

### 🛡️ Safety Shield

matcha ships with `matcha-shield.js` — a deterministic safety gate that blocks dangerous commands before they reach the OS:

| Blocked | Example |
|---------|---------|
| Root filesystem deletion | `rm -rf /`, `rm -rf ~`, `rm -rf .` |
| Permission abuse | `chmod 777` |
| Destructive git | `git push --force` |
| Database destruction | `DROP DATABASE`, `TRUNCATE TABLE` |
| Remote code execution | `curl \| bash`, `wget \| sh` |
| Disk corruption | Write to `/dev/sda`, `mkfs`, `dd` to block device |
| System commands | `shutdown`, `reboot`, `init 0` |

Override: `MATCHA_SHIELD_OFF=true` (not recommended)

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

| Platform | Install Method | What You Get |
|----------|---------------|--------------|
| **Claude Code** | `curl ... \| bash` (detects `.claude/`) | agents + commands + skills + rules + plugin |
| **OpenCode** | `curl ... \| bash` (detects `.opencode/`) | agents + commands + skills + rules + plugin |
| **Cursor** | `curl ... \| bash` (detects `.cursor/`) | 16 `.mdc` rules |
| **Windsurf** | `curl ... \| bash` (detects `.windsurf/`) | 16 `.md` rules |
| **Cline / Roo Code** | `curl ... \| bash` (detects `.clinerules/`) | 16 `.md` rules |
| **Kiro** | `curl ... \| bash` (detects `.kiro/`) | 16 steering files + dev/review modes |
| **OpenClaw** | `curl ... \| bash` (detects `.openclaw/`) | matcha skill |
| **Qoder** | `curl ... \| bash` (detects `.qoder/`) | AGENTS.md + agents + rules + shield hook |
| **Qwen Code** | `curl ... \| bash` (detects `.qwen/`) | QWEN.md + skill + settings.json |
| **Codebuff / agy** | `curl ... \| bash` (detects `.agents/` or global) | agents + commands + rules + skill |
| **Any / None** | `curl ... \| bash` (no platform → creates `.agents/`) | universal format (agents + rules + commands + skill) |
| **Any (npm)** | `npx matcha init` | auto-detect + install |

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

## CLI (npx matcha)

```
npx matcha init        Install matcha to current project
npx matcha status      Show version, platform, components
npx matcha why         5W1H interactive check (piped input supported)
npx matcha audit       Quick project stack audit
npx matcha verify      Auto-detect + run tests, typecheck, lint
npx matcha help        Show usage
```

Supports: npm test, jest, vitest, pytest, go test, cargo test, phpunit, mvn test, gradle test, make test.

---

## Project Structure

```
matcha/
├── bin/matcha.js                  ← CLI (npx matcha)
├── install.sh                     ← 1-script installer
├── QWEN.md                        ← Qwen Code context template
├── AGENTS.md / CLAUDE.md          ← context / persona files
├── rules/                         ← canonical language rules (6 langs)
├── skills/matcha/SKILL.md         ← philosophy + 6 checkpoints
├── commands/                      ← 5 slash commands
├── hooks/                         ← lifecycle hooks + shield
│   ├── hooks.json
│   ├── inject-rules.js
│   ├── matcha-instructions.js
│   └── matcha-shield.js           ← safety gate
├── .claude/                       ← Claude Code (agents + commands + skills)
├── .opencode/                     ← OpenCode (agents + commands + skills + plugin)
├── .cursor/rules/                 ← Cursor (.mdc rules)
├── .agents/                       ← Universal format
├── .clinerules/                   ← Cline
├── .windsurf/rules/               ← Windsurf
├── .kiro/steering/                ← Kiro
├── .openclaw/skills/              ← OpenClaw
├── .qoder/                        ← Qoder (agents + rules + hooks)
├── .qwen/                         ← Qwen Code (skill + settings.json)
├── .claude-plugin/                ← Claude Code plugin manifest
├── gemini-extension.json          ← Antigravity CLI plugin manifest
├── tests/index.js                 ← 216+ tests
└── QUICKSTART.md                  ← 1-minute setup
```

---

## License

MIT © [plumpslabs](https://github.com/plumpslabs)
