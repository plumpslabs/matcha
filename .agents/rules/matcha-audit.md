---
description: "🍵 matcha stack audit — invoke via @matcha-auditor when adding new services or dependencies"
alwaysApply: false
---

# 🔍 matcha Stack Audit

Run this when adding new services or dependencies.

## Check
1. **Scan manifests** — `package.json`, `go.mod`, `docker-compose.yml`, `.env.example`
2. **Scan services** — understand what EACH service actually does
3. **Overlap check** — is any new service duplicating an existing one?
4. **Efficiency check** — any dep installed but unused?

## Output
Report: services found, overlaps, inefficiencies, violations.
Overall health: **CLEAN** / **NEEDS ATTENTION** / **CRITICAL**
