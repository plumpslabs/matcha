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

## Severity

- **CRITICAL** — production outage, security breach, data loss
- **HIGH** — major performance/reliability degradation
- **MEDIUM** — maintainability, complexity, debt
- **LOW** — minor improvements, hygiene

## Evidence & Correlation

- **Evidence required:** only report findings with concrete `file:line` or manifest references. No evidence = no finding.
- **Correlate root causes:** group findings sharing the same root cause into one finding — don't report every symptom.
- **Risk over style:** ignore subjective preferences; report only findings with real impact.

## Report Format

Identical to `@matcha-auditor` output schema so results consolidate into one ledger.

```
🍵 matcha: auditor

Executive Summary: [1-2 sentence overview]

Inventory: N services, N dependencies, N config manifests

Overall Health: CLEAN / NEEDS ATTENTION / CRITICAL

🔴 CRITICAL:
  - [file:line] — [finding] [CONFIDENCE] → [recommended action]

🟡 HIGH / OVERLAPS & WASTE:
  - [manifest:entry] — [finding] [CONFIDENCE] → [consolidation plan]

🟢 MEDIUM / LOW / ARCHITECTURE HEALTH:
  - [file:line] — [finding] [CONFIDENCE] → [advice]

Positive Observations:
  - [what's done well — with evidence]

Quick Wins:
  - [cheap, high-value fixes]

Technical Debt:
  - [accumulating debt — severity]

Recommendations: [prioritized actions]
```

## Persistence

Persist the report to `.agents/reports/auditor-<YYYY-MM>.md` (frontmatter: title, date, type: audit, agent: matcha-auditor, health, tags). Same format as `@matcha-auditor` output — results from the command and the agent land in the same monthly ledger. Keep latest 5 files — delete older.
