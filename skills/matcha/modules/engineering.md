# 🍵 matcha — Engineering Principles

> Universal quality bar for generated code. Domain-agnostic: the *principles* stay fixed,
> the *concrete rules* (which Result type, which validation lib, which logger) live in
> `MATCHA_PROJECT.md`. Load during **implement + review**.

## Scope & Analysis Boundary (Anti-Paranoid Guard)
- **Scope limitation:** Check and enforce directives ONLY for code lines and areas directly touched by the change. Do NOT perform full-codebase audits for localized edits.
- **Context-triggered principles:** Evaluate guidelines (API breaking changes, distributed tracing, ADRs) ONLY when the active change touches those domains. Never block simple edits with unrelated rules.
- **Library Discipline:** Prefer standard library / native platform capabilities first. Ask and confirm before introducing new third-party dependencies or abstractions.
- **Architectural Decisions (ADR):** For major structural or library choices, record inline rationale: `// matcha:adr <decision> (rationale: <why>)`.

## Output Size Discipline (Anti-Overbuild Guard)

Benchmark-proven failure mode: on small features, applying the FULL production bar (named constants, validation helpers, error envelopes, env vars) produced **16.5 median LOC vs 7 (no rules) / 5.5 (terse)** for identical correctness. Rules should not inflate output.

- **Ceremony scales with risk, not habit.** Small task (≤30 LOC total change)? Write the MINIMAL correct solution. Named-constant extraction, validation helpers, and error envelopes apply to L2+ risk (product logic, prod paths, auth, DB) — NOT to a guard clause or a 10-line bug fix.
- **Reuse beats ceremony.** Before adding a helper, ask: does the codebase already have it? (Hunter Protocol). A new 15-line "clean" helper that duplicates an existing one is debt, not quality.
- **Nothing extra that isn't asked.** Don't pre-build pagination, i18n, or abstraction layers for a change that doesn't touch them. YAGNI is a matcha principle at small scale.
- **Extraction threshold:** extract a function/constant only when it removes real duplication (3+ uses) or materially improves readability — not as decoration.
- **When in doubt, ship the small version.** Reviewers flag over-engineering as a finding, but the default is: simplest correct code first.

## Errors

- **Explicit error paths.** Never swallow. Empty catch → log + rethrow or handle; no dummy fallbacks.
- **Every error carries context** — WHAT failed, WHERE (module/function), WHY (root cause). A bare `Error`/`Invalid input` is a bug report nobody can act on.
- **Message language** — *internal* (comments, logs, error details, variable/function names, commit messages): **English always** — code outlives teams, and AI reads it too. *User-facing* messages (UI strings, API responses shown to end users): follow the product language declared in `MATCHA_PROJECT.md` (default English if unset).
- **Actionable** — say what happened *and* what to do next. No generic strings.
- **Recoverable vs fatal.** Recoverable → handle and continue; fatal → fail fast. Fail at the boundary, not mid-flow.
- **Typed/result errors** at boundaries where the project's Error Boundary rule (see `MATCHA_PROJECT.md`) requires them — never throw in service layers if the project convention says Result types.

## Logging

- **Structured, leveled** (debug/info/warn/error) — level matches severity.
- **Log at boundaries + failures** — entry/exit for critical paths; errors carry stack + context.
- **Correlation/request ID** — include correlation/request ID (e.g. W3C traceparent) on multi-step/microservice flows so failure is traceable end-to-end.
- **NEVER log secrets, tokens, passwords, or PII** — redact before logging. This is a security finding, not style.
- **Log each error once**, with context — not the same trace in 3 places.

## Validation

- **Trust no external input.** Validate at every boundary: API edges, CLI args, file reads, DB input, deserialization.
- **Types ≠ runtime validation.** Types are compile-time; untrusted boundaries still need runtime checks (Zod/io-ts/pydantic — whatever the project's Runtime Validation rule says).
- **Fail fast with a clear message** naming the invalid field + expected shape.
- **One validation source per input shape** — don't re-validate the same thing differently in 3 layers.

## API Contracts, Pagination & Caching

- **Consistent error envelope** across endpoints (same shape: error code, message, field, request id).
- **Correct status codes** — 4xx for client errors, 5xx for server errors. Never 200 with an error payload.
- **Pagination convention:** cursor-based for large/real-time feeds; offset-based for static bounded lists. Always include explicit `limit` and `total` / `has_more` indicators.
- **Caching convention:** Cache-Aside with explicit TTL, stale-while-revalidate where suitable, deterministic invalidation keys on mutation.
- **Mutations: idempotency** for retryable operations.
- **Breaking changes & backward compatibility:** maintain backward compatibility for public contracts via explicit deprecation warnings/windows before removing fields.
- **Document the request/response shape** at the boundary (schema/contract file, not prose).

## Component & Presentation (UI / Web)

- **Semantic HTML & Accessibility (a11y):** Use proper HTML5 elements (`<header>`, `<main>`, `<nav>`, `<button>`). Ensure keyboard navigation, focus management, and ARIA attributes where semantic HTML is insufficient.
- **Internationalization (i18n):** Never hardcode user-facing text strings. Use structured locale dictionaries / ICU patterns. Confirm library choice (e.g. i18next) before adding heavy dependencies.
- **State & Hooks:** Single source of truth. Derive computed values, keep local UI state transient, and isolate framework/platform side-effects cleanly.

## State

- **Single source of truth.** Derive, don't duplicate — mirrored copies drift and become bugs.
- **Immutable updates** over in-place mutation — easier to reason about, undo, and test.
- **Cache with explicit invalidation** — stale reads are bugs, not optimizations.
- **No global mutable state** — pass dependencies explicitly.

## Concurrency & Data Integrity

- **Assume concurrent access** — guard shared state (locks, atomics, transactions).
- **Idempotent writes** where retries are possible (pair with Resilience → retry).
- **Check-then-act races** — make the check + act atomic, or expect lost updates.

## Security

- **Trust boundaries** — every input crossing a boundary (network, file, user, deserialization) is untrusted. Validate, encode, and constrain it.
- **AuthN vs AuthZ** — authenticate identity, then authorize every action. Never rely on client-supplied identity; check permissions server-side, per resource (IDOR: does this user own THIS record?).
- **Output encoding** — encode output for its context (HTML, SQL, shell, URL, JSON) to neutralize injection. Parameterize queries, never string-concatenate.
- **Secrets** — never in code, logs, error responses, or client bundles. Env vars + secret manager, rotate, least privilege.
- **Sensitive operations** — CSRF/SSRF/path-traversal/deserialization: validate origin, restrict outbound targets, canonicalize paths, allowlist formats. Rate-limit and audit trails for abuse-prone endpoints.
- **Fail closed** — on ambiguity, deny. Default-deny over default-allow.

## Testing

- **Test behavior, not implementation** — assert outcomes (input → output, side effects), not internal call counts. Tests that break on refactor pin the wrong thing.
- **Test pyramid** — many fast unit tests, fewer integration tests, fewest E2E. Keep unit tests fast enough to run constantly.
- **Mock at boundaries** — fake external I/O (network, DB, clock, files), never mock what you own that is cheap to use real.
- **Coverage is a guard, not a goal** — cover the risky logic (edges, branches, error paths), not line-count vanity.
- **Flaky test = bug in the test** — quarantine or fix immediately; never rerun-to-green or disable silently.

## Resilience & Data

- **Timeouts everywhere** — every external call has a timeout; no unbounded waits.
- **Retry with backoff** — retry transient failures with exponential backoff + jitter; only for idempotent operations; cap attempts.
- **Circuit breaker** — after repeated failures, fail fast instead of hammering a down dependency; recover with a probe.
- **Graceful degradation** — degrade features, don't crash the whole system (fallbacks, caching, partial results with explicit status).
- **Transactions & isolation** — group related writes atomically; know your isolation level; handle deadlock/retry.
- **Migrations with rollback** — schema changes are forward + backward safe; plan rollback before applying.
- **Never lose user data** — destructive ops need backup/confirmation; bulk deletes require a dry-run + limit.
