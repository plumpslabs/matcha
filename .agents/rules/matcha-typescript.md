---
description: Matcha TypeScript/JavaScript coding standards and patterns
globs: ["**/*.{ts,tsx,js,jsx}"]
alwaysApply: false
---

# TypeScript Standards

## Strict Mode, No `any`
```typescript
// ❌ Bad
const data: any = fetchData();
// ✅ Good
const data: unknown = fetchData();
```

## File Naming
kebab-case for utils/hooks, PascalCase for components
`.type.ts` for types, `.hook.ts` for hooks, `.ctx.ts` for context

## Dependency Injection
```typescript
// ❌ singleton import
import { db } from "./db";
// ✅ constructor injection
class UserService { constructor(private db: Database) {} }
```

## Interface vs Type
```typescript
interface User { id: string; name: string; }
type Status = "active" | "inactive";
```

## Async Safety
```typescript
// ❌ Bad — floating promise
fireAndForget();
// ✅ Good
await fireAndForget();
```

## Imports
node → externals → internal → relative

# TypeScript Patterns
- React: hooks over HOCs, composition over inheritance
- Zustand for state management, TanStack Query for server state
- API: typed fetch wrapper, error boundaries
- Testing: Vitest + Testing Library, MSW

## Checklist
- [ ] Types explicit on public APIs — no `any`, use `unknown` + narrow
- [ ] Runtime validation at API boundaries (Zod)
- [ ] Async errors handled — no floating promises
- [ ] Imports: built-in → external → internal → type files
- [ ] No `console.log` committed — proper logger only
- [ ] Before adding dep: search `package.json` + existing `src/utils/` first
