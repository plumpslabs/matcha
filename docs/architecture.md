# 🍵 matcha — Architecture

> Simple. Efficient. Deliberate. Never twice.

---

## Core Pattern: Convention Adapter

**One philosophy, many platforms.** matcha defines engineering conventions once, then adapts them to each AI coding agent's native format.

```
┌──────────────────────────────────────┐
│            PHILOSOPHY                  │
│  skills/matcha/SKILL.md                │
│  AGENTS.md  │  commands/               │
└──────────────────┬───────────────────┘
                   │ canonical source
                   ▼
┌──────────────────────────────────────┐
│          PLATFORM ADAPTERS           │
├──────────┬──────────┬────────┬───────┤
│ .claude/ │.opencode/│.agents/│.kiro/ │
│ .openclaw│          │        │       │
└──────────┴──────────┴────────┴───────┘
```

---

## Source of Truth

| Content | Canonical Location | Format |
|---------|-------------------|--------|
| Philosophy doc | `skills/matcha/SKILL.md` | Markdown (YAML frontmatter) |
| Agent definitions | `.agents/agents/` | YAML frontmatter + Markdown |
| Commands | `commands/` | Markdown (`# /matcha:<name>`) |

| Shield + hooks | `hooks/matcha-shield.js` | ESM module |
| CLI | `bin/matcha.js` | Node.js ESM |

---

## Platform Mapping

| Platform | Adapter | Type |
|----------|---------|------|
| **Claude Code** | `.claude/agents/*` + `.claude/commands/*` + hooks | Symlinks + config |
| **OpenCode** | `.opencode/plugins/matcha.js` + agents | Plugin |
| **Kiro** | `.kiro/steering/matcha*` (3 files) | Steering files |
| **Codebuff / agy** | `.agents/` | Universal format |
| **OpenClaw** | `.openclaw/skills/matcha/SKILL.md` | Symlink |
| **Windsurf** | `.windsurfrules` (root) | Root config |
| **Antigravity CLI** | `GEMINI.md` | Config |

---

## Duplication Policy

1. `.agents/` is the **canonical source** for agents, commands, and skills
2. Platform adapters that expect the same format → symlink to `.agents/`
3. Platform adapters that expect a different format → copy at install time
4. Platform-specific files (e.g., `.claude/commands/` with embedded symlink content) → documented exception

### Why symlinks instead of copies?
- Single source of truth — edit one file, all platforms reflect the change
- No drift between platform copies
- Verified by CI test (`tests/symmetry.test.js`)

### When copies are necessary
Some platforms expect specific file formats:
- **Claude Code commands** use symlinks with embedded content (target = command text)
- **Kiro steering files** use `inclusion` mode metadata

These are maintained as copies or platform-native formats. The install script (`install.sh`) handles generation.

---

## Lifecycle

```
PreToolUse (shield) → Tool Execution → PostToolUse (cleanup) → Stop (tips)
     │                      │                │                     │
     ▼                      ▼                ▼                     ▼
matcha-shield.js          Code          matcha-post-write.js    matcha-stop.js
  • danger patterns       changes         • scan modified files   • git diff scan
  • planning gate                          • report findings       • tips output
```

---

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

---

## Version History

- **v1.0** — Initial convention ruleset for Claude Code
- **v2.0** — Multi-platform adapter pattern, 6 agents, Kuma shield
- **v2.1** — Source of truth consolidation, symlink-based platform adapters
- **v2.2** — Live Claude benchmark, project landing page
