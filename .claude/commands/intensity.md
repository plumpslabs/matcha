# /matcha observe|enforce|audit

Set matcha intensity level for current session.

## Usage
- `/matcha observe` — tips only, non-blocking
- `/matcha enforce` — full philosophy, default
- `/matcha audit` — enforce + mandatory cleanup

## Instructions for agent
When user invokes `/matcha <level>`, set intensity to that level for the remainder of the session. Persist until changed.

Confirm with:
```
🍵 matcha: intensity set to [observe|enforce|audit]
```