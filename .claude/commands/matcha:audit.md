---
description: "🍵 Stack health check — find overlaps, waste, and risks before they become problems"
---
# /matcha:audit

**Stack health check.** Find overlaps, waste, and risks before they become problems.

## Scope

Audit covers: dependencies, services, config, security posture, and architecture health.

## Process

### Step 1 — Inventory

Scan all manifests and config:
- `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `requirements.txt`
- `docker-compose*.yml`, `Dockerfile*`
- `.env.example`, `.env.sample`
- `Makefile`, `justfile`
- `tsconfig.json`, `.eslintrc*`, `prettier*`

For each: **what does it actually do?** Not just "it exists."

### Step 2 — Overlap Detection

| Check | How |
|-------|-----|
| **Duplicate functionality** | Two deps doing the same thing? (e.g., moment + dayjs, lodash + native) |
| **Redundant services** | Two containers/services handling same concern? |
| **Conflicting configs** | ESLint + Prettier fighting? Multiple linters? |
| **Dead dependenc
...
See commands/matcha:audit.md for full