---
description: "🍵 matcha security — pre-commit checks, secret management, auth basics"
alwaysApply: false
---

# 🔒 matcha Security

## Pre-Commit Security Check
- No hardcoded secrets (API keys, passwords, tokens)
- Input validation at every system boundary
- SQL injection prevention (parameterized queries)
- Error messages don't leak internals

## Secret Management
- Env vars with `APPNAME_VAR_NAME` pattern
- NEVER commit secrets to version control
- Validate required secrets at startup
- Rotate exposed secrets immediately

## Auth & Access
- Passwords: bcrypt (cost ≥ 12) or Argon2id
- Rate limit auth endpoints aggressively
- JWT: short access (15min), refresh (7d max)
- Session invalidation on password change

## Checklist
- [ ] Secrets only in env vars, not source
- [ ] Input validation at all boundaries
- [ ] Auth + rate limiting on public endpoints
- [ ] Error responses sanitized (no stack traces)
- [ ] `.env.example` documents all required vars
