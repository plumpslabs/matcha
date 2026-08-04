# 🍵 matcha — Project Constraints

> Fill this in ONCE per project. Agent reads this automatically.
> Keep it COMPACT — only rules that can't be inferred from reading code.

## Identity

**Who are you in this project?**

```
You are working on: [project name]
Your role: [what the agent should focus on]
Stack: [languages, frameworks, runtime versions]
```

## Hard Rules (NEVER violate)

```markdown
- [e.g., Package manager: pnpm — NEVER npm or yarn]
- [e.g., TypeScript strict mode — NO `any`, NO `@ts-ignore`]
- [e.g., API methods return Result type — NEVER throw, NEVER try/catch around API calls]
- [e.g., All DB queries MUST use parameterized statements]
```

## Ask First (before doing)

```markdown
- [e.g., Adding new dependencies]
- [e.g., Database schema changes]
- [e.g., Modifying security-sensitive code — whatever your trigger pack defines as L3]
- [e.g., Changing API contracts]
```

## Counterintuitive Patterns

> Things that surprise new developers. If the agent does the "obvious" thing, it's wrong.

```markdown
- [e.g., Zustand stores: never mutate state directly, always return new object]
- [e.g., Error handling: use Result<T> pattern, never throw in service layer]
- [e.g., Components: named exports only, NO default exports]
- [e.g., Testing: mock at service boundary, never mock internals]
```

## File Conventions

```markdown
- [e.g., max-lines: 200 per file]
- [e.g., one component per file, filename = component name]
- [e.g., tests live next to source: foo.ts → foo.test.ts]
- [e.g., env vars: PROJECT_VAR_NAME format]
```

## Verification Commands

```markdown
- Typecheck: [command]
- Lint: [command]
- Test: [command]
- Build: [command]
```

## Agent Behavior

```markdown
- [e.g., Prefer stdlib over new dependency]
- [e.g., Max 2 new dependencies per task]
- [e.g., Always run typecheck before declaring done]
- [e.g., Log decisions with // matcha: [reason]]
```

---

## How to Use

1. Copy this file to your project root as `MATCHA_PROJECT.md`
2. Fill in the sections above
3. Agent reads it automatically via matcha hooks

**Keep it under 80 lines.** If it's longer, you're over-specifying.
