# 🍵 Real Benchmark: Express API

## Goal

Prove matcha's impact on real code quality by implementing 3 features on an Express API — once without matcha (baseline), once with matcha (enforce mode).

## Codebase

- **Project:** `benchmark/repos/express-api/`
- **Stack:** Express.js, Jest, Supertest
- **Lines of Code:** ~200 LOC
- **Features:** Users CRUD, Auth middleware, Health check

## Features to Implement

### Feature 1: Activity Tracking (L2 — Product Logic)
**Requirement:** Track user activity when they perform actions.

- Add `POST /api/users/:id/activity` endpoint
- Store activity in memory (like users array)
- Validate action is not empty
- Return 201 with activity object
- Return 400 for empty action
- Return 404 for unknown user

**Risk:** L2 — business logic, data validation

### Feature 2: Rate Limiting (L3 — Security)
**Requirement:** Prevent abuse with rate limiting.

- Add rate limit middleware
- Allow 100 requests per minute per IP
- Return 429 with retryAfter when exceeded
- Bypass rate limit for `/health` endpoint
- Use in-memory store (no Redis for benchmark simplicity)

**Risk:** L3 — security, abuse prevention

### Feature 3: Input Sanitization (L2 — Security)
**Requirement:** Prevent XSS and injection attacks.

- Add input sanitization middleware
- Strip HTML tags from string inputs
- Validate email format
- Reject malicious payloads
- Apply to all POST/PUT routes

**Risk:** L2 — security, input validation

## Benchmark Protocol

### Without Matcha (Baseline)

1. Start with clean codebase
2. Implement each feature sequentially
3. No planning gate, no review gate
4. Run tests after each feature
5. Record: time, issues found (post-hoc), test failures

### With Matcha (Enforce)

1. Start with clean codebase + matcha hooks active
2. Follow matcha workflow:
   - 5W1H planning gate
   - Code search before writing (reuse check)
   - Implementation
   - Post-write scan
   - Review gate (8 categories)
3. Run tests after each feature
4. Record: time, issues caught during review, test failures

### Metrics to Compare

| Metric | Without Matcha | With Matcha |
|--------|---------------|-------------|
| **Time to implement** | ? | ? |
| **Test failures** | ? | ? |
| **Issues caught pre-ship** | 0 (no review) | ? |
| **Security issues** | ? (post-hoc) | ? (caught in review) |
| **Code duplication** | ? | ? |
| **Empty catch blocks** | ? | ? |
| **Hardcoded secrets** | ? | ? |
| **Overall quality score** | ? | ? |

## Expected Outcome

Matcha should catch:
- Missing input validation (Feature 1)
- Rate limit bypass edge cases (Feature 2)
- XSS vulnerabilities in user input (Feature 3)
- Empty error handlers
- Missing error responses

Without matcha, these would ship silently.

## How to Run

```bash
# Baseline (no matcha)
cd benchmark/repos/express-api
npm install
# Implement features manually, run tests

# With matcha
cd benchmark/repos/express-api
# Install matcha first
npx matcha@latest init
# Implement features following matcha workflow
npm test
```

## Files Changed

After benchmark, these files should exist:
- `src/routes/activity.js` — Activity tracking
- `src/middleware/rateLimit.js` — Rate limiting
- `src/middleware/sanitize.js` — Input sanitization
- Updated `src/index.js` — Wire up new middleware
- Updated `tests/activity.test.js` — Already exists (tests provided)
- New `tests/rateLimit.test.js` — Already exists (tests provided)
