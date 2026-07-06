# 🍵 Contributing to matcha

Thanks for wanting to make matcha better!

## How to Contribute

### 🐛 Bug Reports

Found a bug? Open an issue with:
- What happened vs what should have happened
- Steps to reproduce
- File paths if relevant (e.g., "CLAUDE.md not syncing after build")

### 💡 Feature Ideas

matcha is always evolving. If you have ideas for:

- **More agent adapters** — rules files for other AI coding tools (e.g., Continue.dev, Zed, etc.)
- **Better SKILL.md instructions** — clearer guidelines for generating context-aware roasts
- **New platform support** — getting matcha working on more AI coding platforms

Open an issue to discuss before sending a PR.

### 🔧 Pull Requests

1. Fork the repo and create a branch from `main`
2. Follow matcha rules while contributing — irony is the highest form of respect
3. Run validation: `npm test`
4. Submit your PR with a clear description of what changed and why

## Project Structure

```
matcha/
├── AGENTS.md                     # Agent registry + command reference
├── CLAUDE.md                     # Claude Code persona
├── skills/matcha/SKILL.md        # Source of truth — full philosophy
├── hooks/                        # Lifecycle hooks (shield, post-write, stop)
├── commands/                     # 6 slash commands
├── .agents/                      # Universal format (agents + commands + skills)
├── .claude-plugin/               # Claude Code plugin config
├── .opencode/plugins/matcha.mjs  # OpenCode plugin
├── bin/matcha.js                 # CLI (status + init)
└── tests/                        # Test suite
```

## Development

```bash
npm test
```

## Guidelines

- Keep it simple. matcha is about **easy AND efficient** — your contribution should be too
- No new dependencies without a one-line justification
- If you're adding a new roast/suggestion pattern, make sure it's **language-agnostic**
- Tests must pass before merging

## Code of Conduct

Be excellent to each other. matcha roasts code, not people.
