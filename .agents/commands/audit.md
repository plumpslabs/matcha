# /matcha:audit

Audit the existing stack for overlaps, inefficiencies, and best practice violations.

## Instructions for agent

Run a medium-depth stack audit:

### Step 1 — Read manifests
- `docker-compose.yml` / `docker-compose.*.yml`
- `package.json`, `go.mod`, `go.sum`, `requirements.txt`
- `.env.example`, `.env.sample`
- `Makefile`, `justfile`

### Step 2 — Read service files
For each service/dependency found, read its config or usage in the codebase.
Understand what it **actually does**, not just that it exists.

### Step 3 — Report findings

```
🍵 matcha: stack audit

Services found: [list]
Dependencies found: [list]

Overlaps detected:
  - [service A] and [service B] both handle [X]
    → Recommendation: ...

Inefficiencies:
  - [thing] is set up but appears unused
    → Recommendation: ...

Best practice violations:
  - Env var [X] doesn't follow APPNAME_VAR_NAME pattern
    → Should be: [Y]

Overall health: [CLEAN / NEEDS ATTENTION / CRITICAL]
```
