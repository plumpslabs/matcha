# 🍵 matcha — Architecture

## Core Pattern: Convention Adapter

**One philosophy, many platforms.** matcha defines engineering conventions once, then adapts them to each AI coding agent's native format.

```
┌─────────────────────────────────────────────────┐
│                 PHILOSOPHY                       │
│  skills/matcha/SKILL.md                          │
│  AGENTS.md  │  commands/  │  rules/              │
└────────────────────┬────────────────────────────┘
                     │ canonical source
                     ▼
┌─────────────────────────────────────────────────┐
│             PLATFORM ADAPTERS                    │
├─────────────┬───────────┬───────────┬────────────┤
│  .claude/   │ .opencode/│ .cursor/  │ .agents/   │
│  .windsurf/ │ .clinerules/ │ .kiro/ │ .openclaw/ │
└─────────────┴───────────┴───────────┴────────────┘
```

## Source of Truth

| Content | Canonical Location | Format |
|---------|-------------------|--------|
| Philosophy doc | `skills/matcha/SKILL.md` | Markdown |
| Agent definitions | `.agents/agents/` | YAML frontmatter + Markdown |
| Commands | `commands/` | Markdown (`# /matcha:<name>`) |
| Rules | `.agents/rules/` | Markdown |
| Shield | `hooks/matcha-shield.js` | ESM module |
| CLI | `bin/matcha.js` | Node.js ESM |

## Platform Mapping

| Platform | Adapter | Type |
|----------|---------|------|
| **Claude Code** | `.claude/agents/*` → symlink to `.agents/agents/` | Symlink |
| | `.claude/commands/*` → Claude-specific symlink format | Native format |
| | `.claude/settings.json` | Config |
| **OpenCode** | `.opencode/agents/*` → symlink to `.agents/agents/` | Symlink |
| | `.opencode/plugins/matcha.mjs` | Plugin |
| **Cursor** | `.cursor/rules/*.mdc` | Copy |
| **Windsurf** | `.windsurf/rules/*` + `.windsurfrules` | Copy |
| **Cline / Roo** | `.clinerules/matcha*` | Symlink to `.agents/rules/` |
| **Kiro** | `.kiro/steering/matcha*` | Copy |
| **Codebuff / agy** | `.agents/` | Universal format |
| **Antigravity CLI** | `GEMINI.md` + `gemini-extension.json` | Config |
| **OpenClaw** | `.openclaw/skills/matcha/SKILL.md` | Symlink |
| **Qoder** | `.qoder/` | Config |
| **Qwen Code** | `.qwen/` | Config |

## Duplication Policy

1. `.agents/` is the **canonical source** for agents, commands, rules, and skills
2. Platform adapters that expect the same format → symlink to `.agents/`
3. Platform adapters that expect a different format → copy at install time
4. Platform-specific files (e.g., `.claude/commands/` with embedded symlink content) → documented exception
5. `.agent-backups/` → never committed (in `.gitignore`)

### Why symlinks instead of copies?

- Single source of truth — edit one file, all platforms reflect the change
- No drift between platform copies
- Verified by CI test (`tests/symmetry.test.js`)

### When copies are necessary

Some platforms expect specific file formats:
- **Cursor** uses `.mdc` files with YAML frontmatter (`globs`, `alwaysApply`)
- **Claude Code commands** use symlinks with embedded content (target = command text)
- **Kiro steering files** use `inclusion` mode metadata

These are maintained as copies or platform-native formats. The install script (`install.sh`) handles generation.

## Lifecycle

```
PreToolUse (shield) → Tool Execution → PostToolUse (cleanup) → Stop (tips)
     │                                                              │
     ▼                                                              ▼
  matcha-shield.js                                          matcha-stop.js
  blocks dangerous commands                                   session tips
```

## Kuma Integration

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│  Agent     │────▶│  matcha    │────▶│  Kuma MCP  │
│  (any)     │     │  Shield    │     │  Server    │
└────────────┘     └────────────┘     └────────────┘
                       │                    │
                  conventions           execution
                  (front-end)          safety (back-end)
```

## Version History

- **v1.0** — Initial convention ruleset for Claude Code
- **v2.0** — Multi-platform adapter pattern, 6 agents, Kuma shield
- **v2.1** — Source of truth consolidation, symlink-based platform adapters

Planned:
- **v3.0** — Remove deprecated adapters (`gemini-extension.json`), built-in debt tracker
