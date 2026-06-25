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
3. If you're adding a new adapter file, add it to:
   - `scripts/build-openclaw-skills.js` (if it should be auto-generated)
   - `scripts/check-rule-copies.js` (if it should be validated)
   - `tests/index.js` (if it should exist)
   - `bin/matcha.js` ADAPTERS (if it should be installable via CLI)
4. Run validation before submitting:
   ```bash
   npm run build
   npm run check
   npm test
   ```
5. Submit your PR with a clear description of what changed and why

## Project Structure

```
matcha/
├── AGENTS.md                     # Universal fallback ruleset
├── CLAUDE.md                     # Claude Code-specific fallback
├── LICENSE                       # MIT license
├── README.md                     # You are here
├── CONTRIBUTING.md               # This file
├── skills/matcha/SKILL.md        # Source of truth — full ruleset
├── hooks/
│   ├── inject-rules.js           # ESM lifecycle hooks (Claude Code, Codex)
│   └── matcha-instructions.js    # Shared ESM module — reads SKILL.md
├── .cursor/rules/matcha.mdc      # Cursor adapter (source for static copies)
├── .windsurf/rules/matcha.md     # Windsurf adapter
├── .clinerules/matcha.md         # Cline adapter
├── .kiro/steering/matcha.md      # Kiro adapter
├── .agents/rules/matcha.md       # Generic agent adapter
├── .claude-plugin/               # Claude Code / Codex plugin config
├── .opencode/plugins/matcha.mjs  # OpenCode server plugin
├── commands/                     # Slash command implementations
├── bin/matcha.js                 # CLI installer
├── scripts/
│   ├── build-openclaw-skills.js  # Regenerate all adapter copies
│   └── check-rule-copies.js      # Verify copies are in sync
└── tests/index.js                # Validation test suite
```

## Development

```bash
# Install dependencies (none currently — pure Node.js)
npm install

# Validate your changes
npm run build   # Regenerate all adapter copies
npm run check   # Verify all copies are consistent
npm test        # Run the validation test suite
```

## Guidelines

- Keep it simple. matcha is about **easy AND efficient** — your contribution should be too
- No new dependencies without a one-line justification
- If you're adding a new roast/suggestion pattern, make sure it's **language-agnostic**
- Tests must pass before merging

## Code of Conduct

Be excellent to each other. matcha roasts code, not people.
