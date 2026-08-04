# 🍵 matcha — Context-Aware Modes

> Agent auto-switches behavior based on what it's doing.
> Zero friction when exploring. Full enforcement when implementing.

## Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **🔍 Explore** | Reading, greping, navigating | Zero friction. Read-only. Fast. |
| **🛠️ Implement** | Writing new code | Standard matcha rules. Planning gate. |
| **🔄 Refactor** | Changing existing code | Cautious. Impact analysis. Backup first. |
| **🐛 Debug** | Error, stuck, investigating | Hypothesis-driven. One at a time. |
| **🔒 Review** | Finished implementing | Full review gate. Risk-based. |

## Mode Detection

Auto-detect from user intent + actions:

### 🔍 Explore Mode
- User says: "show me", "find", "where is", "how does", "explain"
- Agent is: grepping, reading files, navigating directory tree
- **Behavior:** Zero planning gate. Zero review. Just read and report.

### 🛠️ Implement Mode
- User says: "implement", "create", "add", "build", "write"
- Agent is: writing new files, creating new functions
- **Behavior:** Planning gate enforced. Standard checkpoints.

### 🔄 Refactor Mode
- User says: "refactor", "clean up", "reorganize", "extract", "split"
- Agent is: modifying existing files, moving code
- **Behavior:** Impact analysis first. Git checkpoint. Incremental batches. Legacy protocol for old code.

### 🐛 Debug Mode
- User says: "fix", "debug", "error", "bug", "broken", "not working"
- Agent is: investigating errors, reading logs, testing hypotheses
- **Behavior:** One hypothesis at a time. Evidence required. No guessing.

### 🔒 Review Mode
- User says: "review", "check", "audit", "verify"
- Agent is: reading diff, checking code quality
- **Behavior:** Full review gate. Risk-based routing. Verdict required.

## Mode Switching Rules

1. **Auto-switch** — detect mode from first action, not user declaration
2. **Explicit override** — user can say "refactor mode" to force
3. **Mode stack** — can be in multiple modes (e.g., debug + review)
4. **Mode memory** — remember mode for session until changed

## Integration

### With Planning Gate
| Mode | Planning Gate |
|------|--------------|
| Explore | ⏭️ Skip |
| Implement | ✅ Enforce |
| Refactor | ✅ Enforce + legacy protocol |
| Debug | ⏭️ Skip (investigation, not implementation) |
| Review | ⏭️ Skip (read-only) |

### With Review Gate
| Mode | Review Gate |
|------|------------|
| Explore | ⏭️ Skip |
| Implement | ✅ Enforce |
| Refactor | ✅ Enforce + regression check |
| Debug | ⏭️ Skip |
| Review | ✅ IS the review |

### With Legacy Protocol
| Mode | Legacy Protocol |
|------|----------------|
| Explore | ⏭️ Skip |
| Implement (new code) | ⏭️ Skip |
| Refactor (existing code) | ✅ Activate if file >6mo or >300 lines |
| Debug | ⏭️ Skip |
| Review | ✅ Check legacy compliance |

## Output

```
🍵 matcha: [mode] mode active

Mode: 🔍 Explore — zero friction, read-only
OR
Mode: 🛠️ Implement — planning gate enforced
OR
Mode: 🔄 Refactor — impact analysis + legacy protocol
OR
Mode: 🐛 Debug — hypothesis-driven, one at a time
OR
Mode: 🔒 Review — full review gate, risk-based
```
