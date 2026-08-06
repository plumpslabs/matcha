---
description: "🍵 Scan for // matcha: markers in the codebase and group by severity"
---
# /matcha:markers

**Scan for `// matcha:` markers** and group by severity level.

## Levels

| Marker | Level | Description |
|--------|-------|-------------|
| `// matcha:explain [reason]` | LOW | Documented shortcut — no action |
| `// matcha:todo [task]` | MEDIUM | Future task — schedule or track |
| `// matcha:debt [reason], [fix when]` | HIGH | Technical debt — must resolve |
| `// matcha:adr [ADR-NUMBER]` | INFO | Architecture decision reference |

## Format Rules (enforced)

- **Standard format only**: `matcha:<type> <reason>` — types: `explain`, `todo`, `debt`, `adr`.
- **English only**: markers written in another language (e.g. Indonesian) are non-compliant. Rewrite: `// matcha:explain <english reason>`.
- **Real reason**: never leave a placeholder or empty marker.

The post-write hook flags non-English/placeholder markers, and the reviewer reports them as WARNING.

## Usage

```
node 
...
See commands/matcha:markers.md for full