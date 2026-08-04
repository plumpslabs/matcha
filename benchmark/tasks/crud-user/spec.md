# Benchmark: CRUD User Feature

**Risk Level:** L2 (Product Logic)
**Estimated Complexity:** Medium
**Files to modify:** 2-3 files

## Task

Implement a complete CRUD user feature for the Express API:

### Requirements
1. **GET /api/users** — List all users (with pagination)
2. **GET /api/users/:id** — Get user by ID
3. **POST /api/users** — Create new user (with validation)
4. **PUT /api/users/:id** — Update user
5. **DELETE /api/users/:id** — Delete user

### Constraints
- Use existing `src/routes/users.js` as base
- Add input validation (email format, required fields)
- Return proper HTTP status codes (200, 201, 400, 404)
- Add error handling for all endpoints
- Write tests for all endpoints

### Evaluation Criteria

| Metric | Good | Bad |
|--------|------|-----|
| LOC | < 200 | > 300 |
| Test coverage | > 80% | < 50% |
| Error handling | All paths | Missing paths |
| Validation | Input validated | No validation |
| HTTP codes | Correct | Wrong/generic |
| N+1 queries | 0 | Multiple |
| Dead code | 0 | > 2 lines |

### Without Matcha
- Agent langsung implement semua
- Mungkin lupa error handling
- Mungkin tidak ada validation
- Mungkin tidak ada pagination
- Test coverage rendah

### With Matcha
- Scout: analyze existing code, find patterns
- Planner: plan 5W1H, identify edge cases
- Executor: implement per endpoint
- Reviewer: check error handling, validation, HTTP codes
- Verifier: run tests, check coverage

## Expected Impact

| Metric | Without Matcha | With Matcha | Delta |
|--------|----------------|-------------|-------|
| LOC | ~250 | ~180 | -28% |
| Error handling | 60% | 100% | +40% |
| Test coverage | 50% | 85% | +35% |
| Review issues | 0 found | 3-5 caught | +5 issues |
| Time to complete | ~10 min | ~15 min | +50% |
| Quality score | 6/10 | 9/10 | +50% |
