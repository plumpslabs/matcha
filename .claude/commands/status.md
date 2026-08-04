# /matcha:status

Show current matcha session status.

## Instructions for agent

Report:
1. **Intensity level** — current (observe/enforce/audit), defaults to enforce
2. **Available agents** — list matcha-* agents in .claude/agents/
3. **Available commands** — list matcha:* commands
4. **Quick health** — any temp files? uncommitted changes?

```
🍵 matcha: status

Intensity: [enforce]
Agents: matcha-planner, matcha-reviewer, matcha-finder, matcha-auditor, matcha-cleaner, matcha-debugger
Commands: how, review, audit, intensity, status
Health: [any issues flagged]
```