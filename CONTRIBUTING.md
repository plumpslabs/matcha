# 🍵 Contributing to matcha

Thanks for wanting to make matcha better!

## Philosophy

matcha is about **simple AND efficient**. Your contribution should be too.

**Do:**
- Keep changes minimal and focused
- Reuse existing patterns
- Add tests for new functionality
- Follow matcha conventions (eat your own dog food)

**Don't:**
- Add dependencies without clear justification
- Over-engineer solutions
- Break the "simple" in "Simple. Efficient. Deliberate. Never twice."

---

## Development

```bash
# Clone
git clone https://github.com/plumpslabs/matcha.git
cd matcha

# Install
npm install

# Test
npm test

# Build adapters
npm run build

# Verify build
npm run build:check
```

---

## Project Structure

```
matcha/
├── AGENTS.md                     # Primary cross-tool file
├── skills/matcha/
│   ├── SKILL.md                  # Router (references modules)
│   └── modules/                  # 5 modular skill components
│       ├── core.md               # 6-checkpoint filter + TDD + loops + format
│       ├── project.md            # Project constraints template
│       ├── modes.md              # Context-aware mode switching
│       ├── risk.md               # Risk-based review routing (L0-L3)
│       └── legacy.md             # Legacy code protocol
├── hooks/                        # Lifecycle hooks
│   ├── patterns.json             # Multi-language pattern registry
│   ├── matcha-mcp-server.js      # MCP server
│   ├── matcha-shield.js          # Safety gate
│   ├── matcha-post-write.js      # Cleanup enforcement
│   └── matcha-stop.js            # End-of-task tips
├── commands/                     # 7 slash commands
├── .agents/agents/               # 6 agent definitions (canonical)
├── scripts/
│   ├── build-adapters.js         # Generate platform files
│   └── check-rule-copies.js      # Verify copies in sync
├── bin/matcha.js                 # CLI
└── tests/                        # Test suite
```

---

## Making Changes

### Source of Truth

- **Agents:** `.agents/agents/*.md` (canonical)
- **Commands:** `commands/*.md` (canonical)
- **Skills:** `skills/matcha/SKILL.md` + `modules/*.md` (canonical)
- **Hooks:** `hooks/*.js` (canonical)

### After Editing

```bash
# Rebuild all platform adapters
npm run build

# Verify everything in sync
npm run build:check

# Run tests
npm test
```

### Platform Adapters

`.claude/`, `.opencode/`, `.openclaw/` are **generated** from source. Don't edit them directly — edit the source and rebuild.

---

## Adding a New Command

1. Create `commands/newcommand.md`
2. Add to `COMMAND_NAMES` in `scripts/build-adapters.js`
3. Run `npm run build`
4. Add test in `tests/commands.test.js`

## Adding a New Agent

1. Create `.agents/agents/matcha-newagent.md`
2. Add to `AGENT_NAMES` in `scripts/build-adapters.js`
3. Run `npm run build`
4. Add test in `tests/agents.test.js`

## Adding a New Skill Module

1. Create `skills/matcha/modules/newmodule.md`
2. Add to module index in `skills/matcha/SKILL.md`
3. Add test in `tests/core.test.js`

## Adding a New Hook

1. Create `hooks/matcha-newhook.js`
2. Register in `hooks/hooks.json` and `.claude/settings.json`
3. Add to install script in `install.sh`
4. Add test in `tests/hooks.test.js`

---

## Pull Requests

1. Fork + branch from `main`
2. Make changes
3. `npm run build && npm test`
4. PR with clear description of **what** and **why**

---

## Code of Conduct

Be excellent. matcha roasts code, not people. 🍵
