# 🍵 matcha — Upgrade Guide

## v1.x → v2.0

### What changed

- Multi-platform adapter pattern (Claude Code → 12 platforms)
- 6 dedicated agents (planner, finder, auditor, reviewer, cleaner, debugger)
- Kuma MCP safety shield
- Symlink-based canonical source (`docs/architecture.md`)

### Migration

1. Run `install.sh` with your platform:
   ```bash
   bash install.sh --platform claude --profile full
   ```

2. If you had custom rules in `CLAUDE.md`, move them to `.agents/rules/`:
   ```
   .agents/rules/your-custom-rule.md
   ```

3. Agents are now in `.agents/agents/`:
   - Old: `.claude/agents/matcha-*.md` (direct file)
   - New: `.claude/agents/matcha-*.md` → symlink to `.agents/agents/`
   - Edits go to `.agents/agents/` only

## v2.0 → v2.1

### What changed

- Source-of-truth consolidation
- `.agents/` is now canonical for all shared content
- Other platform directories use symlinks where possible
- `skills/matcha/SKILL.md` is canonical; other copies are symlinks

### Migration

No action needed. If you cloned the repo, re-run `install.sh` to get symlinks:

```bash
bash install.sh --platform claude --profile minimal
```

Or manually:
```bash
rm .opencode/agents/*.md && ln -s ../../.agents/agents/*.md .opencode/agents/
rm .claude/agents/*.md && ln -s ../../.agents/agents/*.md .claude/agents/
```

## v3.0 (planned)

### Deprecations

- `gemini-extension.json` — removed (migrated to `GEMINI.md` + skills)
- Old single-platform configs — consolidated into `.agents/` format

### Checking your version

```bash
matcha --version
# or check package.json
```
