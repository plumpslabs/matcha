---
description: "🍵 Stack health check — find overlaps, waste, and risks before they become problems"
alias: ["matcha:audit", "audit"]
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
| **Dead dependencies** | Installed but never imported/used? |

### Step 3 — Waste Detection

| Check | How |
|-------|-----|
| **Unused deps** | Check dependency list vs actual imports. Grep for usage. |
| **Over-abstracted code** | Abstractions used <2 times. Inline them. |
| **Dead config** | Config files for tools not installed. |
| **Stale migrations** | DB migrations that are backward-compatible but still present. |

### Step 4 — Security Posture

| Check | How |
|-------|-----|
| **Known vulnerabilities** | Run package manager audit (npm audit, pip audit, cargo audit, etc.) |
| **Outdated deps** | Major versions behind? Security patches missing? |
| **Secret exposure** | `.env` in git? Secrets in config files? |
| **Missing security deps** | No rate limiting? No input validation library? |

### Step 5 — Architecture Health

| Check | How |
|-------|-----|
| **Circular deps** | Module A → B → A. Break the cycle. |
| **God modules** | Single file doing too much. Split. |
| **Inconsistent patterns** | Mixed error handling, mixed logging, mixed auth. |
| **Missing abstractions** | Same boilerplate in 3+ places. Extract. |

## Report Format

```
🍵 matcha: stack audit

Inventory: N services, N dependencies, N config files

Overlaps:
  - [A] and [B] both handle [X]
    → Recommendation: [consolidate/remove/keep]

Waste:
  - [dep/service] installed but unused
    → Recommendation: [remove]

Security:
  - [vulnerability/issue]
    → Recommendation: [fix/upgrade/audit]

Architecture:
  - [issue]
    → Recommendation: [refactor/split/extract]

Health: CLEAN / NEEDS ATTENTION / CRITICAL
```
