# /matcha:markers

**Scan for `// matcha:` markers** and group by severity level.

## Levels

| Marker | Level | Description |
|--------|-------|-------------|
| `// matcha:explain [reason]` | LOW | Documented shortcut — no action |
| `// matcha:todo [task]` | MEDIUM | Future task — schedule or track |
| `// matcha:debt [reason], [fix when]` | HIGH | Technical debt — must resolve |
| `// matcha:adr [ADR-NUMBER]` | INFO | Architecture decision reference |

## Usage

```
node bin/matcha.js markers
```
Or: `/matcha:markers`

## Output

```
🍵 matcha: markers

Total: N markers
  explain: N (LOW)
  debt:    N (HIGH) ← action needed
  todo:    N (MEDIUM)
  adr:     N (INFO)

HIGH items:
  src/auth/login.ts:42 — workaround for legacy API
  src/db/queries.ts:87 — N+1 query, refactor when migrating ORM

Run /matcha:debt for full debt report.
```

## Purpose

Prevents marker drift. Run before commit to ensure all deliberate shortcuts are documented and no HIGH-debt items are forgotten.