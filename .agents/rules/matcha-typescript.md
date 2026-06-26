---
description: Matcha TypeScript/JavaScript coding standards and patterns
globs: ["**/*.{ts,tsx,js,jsx}"]
alwaysApply: false
---

# TypeScript Standards

## Strict Mode, No `any`
```typescript
// ❌ Bad — any
const data: any = fetchData();
// ✅ Good — unknown + narrow
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
class Service { constructor(private db: Database) {} }
```

## Interface vs Type
```typescript
interface User { id: string; name: string; }
type Status = "active" | "inactive";
```

## Async Safety — no floating promises

## Imports — node → externals → internal → relative

# TypeScript Patterns
- Zustand + TanStack Query for state
- Typed fetch wrapper, error boundaries
- Testing: Vitest + Testing Library

# 🔎 Reuse check
Before npm package: search `package.json` + `src/utils/`
