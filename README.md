<p align="center">
  <img src="https://raw.githubusercontent.com/plumpslabs/matcha/main/public/matcha.png" alt="🍵 matcha" width="120" />
</p>

<h1 align="center">🍵 matcha</h1>

<p align="center">
  <em>Simple. Efficient. Deliberate. Never twice.</em>
</p>

<p align="center">
  <a href="https://github.com/plumpslabs/matcha/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT" />
  </a>
  
  <a href="https://github.com/plumpslabs/matcha">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome" />
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node >=18" />
</p>

<p align="center">
  An engineering philosophy ruleset for AI coding agents that enforces deliberate, efficient thinking <strong>before, during, and after</strong> every implementation.
</p>

<p align="center">
  Works with <b>Claude Code</b>, <b>Codex</b>, <b>Cursor</b>, <b>Windsurf</b>, <b>Cline</b>, <b>OpenCode</b>, <b>Kiro</b>, <b>Antigravity</b>, and any AI agent that reads rules from the project root.
</p>

---

## 🚀 Quick Start

```bash
npx matcha-convention install
```

That's it. Rules are copied to your project. Commit them and your AI agent will follow matcha from the next task.

### Per-agent setup

<details>
<summary><b>Claude Code</b></summary>

```
/plugin install https://github.com/plumpslabs/matcha-convention
```

Or via UI: Customize → + personal plugins → Create plugin → Add from repository → enter URL.
</details>

<details>
<summary><b>Codex</b></summary>

```
codex plugin marketplace add plumpslabs/matcha-convention
```
</details>

<details>
<summary><b>Cursor / Windsurf / Cline / Kiro</b></summary>

```bash
npx matcha-convention install
```
</details>

<details>
<summary><b>OpenCode</b></summary>

Add to your `opencode.json`:
```json
{ "plugin": ["matcha-convention"] }
```
</details>

<details>
<summary><b>Antigravity / Gemini CLI</b></summary>

```
agy plugin install https://github.com/plumpslabs/matcha-convention
```
</details>

<details>
<summary><b>Any agent (universal fallback)</b></summary>

Copy `AGENTS.md` to your project root. Most modern agents auto-load it with zero configuration.
</details>

---

## 📋 What matcha Enforces

| Rule | What it means |
|---|---|
| **5W1H Gate** | Answer What / Why / Who / When / Where / How before acting |
| **Stack Audit** | Scan existing stack before adding anything new |
| **Overlap Check** | New thing overlaps existing? → Stop. Ask the user. |
| **Mid-task Blocking** | Find a better path mid-task? → STOP immediately |
| **Post-impl Review** | After every task: "Is there a simpler path?" |
| **Cleanup Protocol** | Done = working AND clean |
| **Snarky Suggestions** | 3 context-aware roasts at the end of every task 🍵 |

---

## 🎮 Slash Commands

| Command | Description | Available on |
|---|---|---|
| `/matcha:why` | 5W1H check before starting a task | Claude Code, Codex, OpenCode, Antigravity |
| `/matcha:audit` | Scan stack for overlaps & inefficiencies | Claude Code, Codex, OpenCode, Antigravity |
| `/matcha:review` | Post-implementation efficiency review | Claude Code, Codex, OpenCode, Antigravity |

> **Note:** Instruction-only tools (Cursor, Windsurf, Cline, Kiro) get the always-on ruleset without slash commands.

---

## 🍵 The Snarky Suggestions

At the end of every task, matcha's rules instruct your AI agent to generate **3 context-aware suggestions** — part roast, part advice, always actionable.

> **Not hardcoded.** The agent generates suggestions dynamically based on your actual code, so they're always relevant and adapt to your conversation language (English, Indonesian, or whatever you're using).

The agent looks at what was just implemented and roasts the juiciest targets:
- Added a service that overlaps with existing ones? → Redundancy detected
- Left a TODO behind? → Procrastination called out
- Debug logs still in code? → Caught in 4K
- Error handling is just `catch {}`? → Swallowing errors exposed
- Nested loops running wild? → O(n³) shamed

```
🍵 matcha says:

🧠 tip 1:
🍵 [roast based on what you just coded]
→ [actionable suggestion]

🧠 tip 2:
🍵 [roast]
→ [suggestion]

🧠 tip 3:
🍵 [roast]
→ [suggestion]
```

> Tone is casual, direct, lightly sarcastic — like a senior dev who's explained this one too many times.

---

## 📐 Communication Format

When matcha flags something mid-task:

```
🍵 matcha: [TITLE]

Observation: [what was found]
Why it matters: [impact]
Options:
  A) [option] — [trade-off]
  B) [option] — [trade-off]

Recommendation: [which and why]
Waiting for your call.
```

When a better path is found mid-implementation:

```
⚠️ matcha pause

Current approach: [what you're doing]
Issue: [why it's suboptimal]
Alternative: [what you found]
Trade-off: [what changes]

How do you want to proceed?
```

---

## 🔧 Supported Agents

| Agent | Method | File(s) |
|---|---|---|
| Claude Code | Plugin | `.claude-plugin/`, `CLAUDE.md` |
| Codex | Plugin | `.claude-plugin/` (shared runtime) |
| OpenCode | Server plugin | `.opencode/plugins/matcha.mjs` |
| Antigravity / Gemini CLI | Extension | `gemini-extension.json` |
| Cursor | Rules | `.cursor/rules/matcha.mdc` |
| Windsurf | Rules | `.windsurf/rules/matcha.md` |
| Cline | Rules | `.clinerules/matcha.md` |
| Kiro | Steering | `.kiro/steering/matcha.md` |
| **All others** | Universal | `AGENTS.md` / `CLAUDE.md` |

---

## 🛠 Maintenance

When you update the source files (`skills/matcha/SKILL.md` or `AGENTS.md`):

```bash
npm run build   # Regenerate all adapter copies
npm run check   # Verify all copies are consistent
npm test        # Run the validation test suite
```

The build script copies:
- `skills/matcha/SKILL.md` → `.openclaw/skills/matcha/SKILL.md`
- `.cursor/rules/matcha.mdc` → `.windsurf/`, `.clinerules/`, `.kiro/`, `.agents/` copies
- `AGENTS.md` → `CLAUDE.md`

---

## 🤝 Contributing

PRs are welcome! See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full guide, project structure, and development workflow.

---

## 📄 License

MIT © [plumpslabs](https://github.com/plumpslabs)
