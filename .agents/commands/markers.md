# /matcha:markers

Scan the codebase for all `// matcha:` markers and group by level.

## Levels
- `// matcha:explain [reason]` — LOW (logged, no action)
- `// matcha:debt [reason], [fix when]` — HIGH (needs resolution)
- `// matcha:todo [task]` — MEDIUM (future task)
- `// matcha:adr [ADR-NUMBER]` — INFO (references an ADR)

## Usage
```
node bin/matcha.js markers
```
Or via slash command: `/matcha:markers`

## Output
```
🍵 matcha: markers

Total markers: 12
  explain: 5 (LOW)
  debt:    3 (HIGH) ← action needed
  todo:    3 (MEDIUM)
  adr:     1 (INFO)

HIGH items:
  src/auth/login.ts:42 — workaround for legacy API
  ...
```

## Purpose
Prevents marker drift. Run before commit to ensure all deliberate shortcuts are documented and no HIGH-debt items are forgotten.
