# 🍵 matcha — Project Constraints (`MATCHA_PROJECT.md`)

> **Single Source of Truth for Project Rules.** Auto-read by AI Agents.
> Keep it **COMPACT & ACTIONABLE** (under 60 lines) — only rules that cannot be inferred from code.

```markdown
# 🍵 MATCHA_PROJECT.md — Project Constraints

## 1. Stack & Architecture
- **Ecosystem & Language:** [e.g., Rust / TypeScript / Go / Python]
- **Framework & Runtime:** [e.g., Next.js / Axum / Gin / FastAPI]
- **Database / Storage:** [e.g., PostgreSQL / Redis / SQLite]
- **State & Architecture:** [e.g., Pure Domain Core, Layered Architecture]

## 2. Hard Rules (NEVER Violate)
- **Package Manager:** [e.g., pnpm / cargo / poetry / go mod] — NEVER use unapproved managers.
- **Type Safety:** [e.g., Strict types. NO `any`/`void*`/`interface{}`, NO `@ts-ignore`/`unsafe` blocks, NO unwrap on Option/Result without context].

- **Error Boundary:** [e.g., Return explicit Result types. NEVER throw or swallow exceptions].
- **Security:** All queries MUST be parameterized. Credentials isolation via env vars `[APPNAME]_VAR_NAME`.

## 3. Verification Commands
- **Typecheck / Lint:** [e.g., pnpm typecheck / cargo check / mypy .]
- **Test Suite:** [e.g., pnpm test / cargo test / pytest]
- **Build Target:** [e.g., pnpm build / cargo build / python -m build]

## 4. Counterintuitive Patterns (Things that surprise new devs)
- [e.g., API methods return Result<T, E> — NEVER throw in service layer]
- [e.g., React components: named exports only, NO default exports]
- [e.g., State stores: never mutate state directly, always return new immutable object]

## 5. Ask First (L3 High Risk Triggers)
- Adding new external dependencies or libraries
- Database schema changes or migrations
- Modifying security, auth, or payment boundary code
```

---

## 💡 How to Have AI Auto-Populate This File

You can instruct your AI Agent:
> *"@matcha-planner scan the codebase and fill in MATCHA_PROJECT.md based on our current stack, conventions, and test commands."*

