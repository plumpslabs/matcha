# Security Guidelines

> Common security practices applicable to all projects.

## Mandatory Pre-Commit Checks

Before ANY commit, verify:

- [ ] No hardcoded secrets (API keys, passwords, tokens, connection strings)
- [ ] All user inputs validated at system boundaries
- [ ] SQL/NoSQL injection prevention (parameterized queries)
- [ ] XSS prevention (output sanitized, CSP headers)
- [ ] CSRF protection on state-changing endpoints
- [ ] Authentication + authorization verified on protected routes
- [ ] Rate limiting on all public endpoints
- [ ] Error messages don't leak internals (stack traces, DB details)
- [ ] File uploads validated (type, size, path traversal)

## Secret Management

```env
# ❌ Bad — hardcoded
API_KEY = "sk-abc123..."

# ✅ Good — env var with APPNAME_ prefix
MATCHA_API_KEY = "${MATCHA_API_KEY}"

# ✅ Good — .env.example documents what's needed, .env has real values
```

- NEVER commit secrets to version control
- ALWAYS use environment variables or a secret manager (Vault, AWS Secrets Manager)
- Validate required secrets at startup — fail fast if missing
- Rotate exposed secrets immediately
- `.env.example` documents required vars without real values

## Authentication & Authorization

- Passwords: hash with bcrypt (cost ≥ 12) or Argon2id
- Tokens: JWT with short expiry (15min access, 7d refresh max)
- API keys: generate cryptographically random, hash before storing
- Rate limit auth endpoints (login, register, password reset) aggressively
- Session invalidation on password change

## Dependency Security

- Scan dependencies for known CVEs (`npm audit`, `snyk`, `dependabot`)
- Pin major versions, review minor/patch updates
- Remove unused dependencies regularly
- Avoid packages with low maintenance or suspicious provenance

## Checklist

- [ ] No secrets in source code
- [ ] Input validation at all API boundaries
- [ ] Auth + rate limiting on public endpoints
- [ ] Error responses don't leak internals
- [ ] Dependencies scanned for vulnerabilities
- [ ] `.env.example` updated with all required vars
