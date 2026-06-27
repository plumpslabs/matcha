---
paths:
- "**/*.ts"
- "**/*.tsx"
- "**/*.js"
- "**/*.jsx"
---

# TypeScript Coding Standards

> This file extends [common/coding-standards.md](../common/coding-standards.md) with TypeScript-specific rules.

## Strict Mode, No `any`
```typescript
// ❌ Bad
const data: any = fetchData();
function process(x: any) { return x.value; }
// ✅ Good
const data: unknown = fetchData();
function process<T>(x: T) { return x; }
```

## File Naming
```
kebab-case     →  components/, pages/, hooks/
PascalCase.ts  →  components/UserCard.tsx (1 component = 1 file)
kebab-case.ts  →  utils/, lib/, api/
*.type.ts      →  type definitions
*.hook.ts      →  custom hooks
*.ctx.ts       →  context files
```

## Dependency Injection
```typescript
// ❌ Bad — singleton import
import { db } from "./db";
class UserService { async get(id: string) { return db.query(id); } }

// ✅ Good — constructor injection
interface Database { query(id: string): Promise<User>; }
class UserService {
  constructor(private db: Database) {}
  async get(id: string) { return this.db.query(id); }
}
// ✅ Factory for manual DI
function createUserService(db: Database) { return new UserService(db); }
```

## Interface vs Type
```typescript
// ✅ interface for public API (extensible)
interface User { id: string; name: string; }
// ✅ type for unions/utilities
type Status = "active" | "inactive";
type DeepPartial<T> = { [K in keyof T]?: T[K] };
```

## Async Safety
```typescript
// ❌ Bad — floating promise
fireAndForget();
// ✅ Good
await fireAndForget();
void fireAndForget().catch(logger.error);

// ❌ Bad — promise racing without error handling
const [a, b] = await Promise.all([fetchA(), fetchB()]);
// ✅ Good — allSettled for partial failures
const results = await Promise.allSettled([fetchA(), fetchB()]);
const successes = results.filter(r => r.status === 'fulfilled').map(r => r.value);
```

## Validation (Zod)
```typescript
import { z } from 'zod';

// ✅ Runtime validation at API boundaries
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().positive(),
});
type User = z.infer<typeof UserSchema>;

// ✅ Parse at boundary, use typed value internally
const user = UserSchema.parse(apiResponse);  // throws on invalid
// Or: const result = UserSchema.safeParse(apiResponse);  // returns result.success
```

## Imports Order
```
// 1. Node built-ins
import { readFile } from "fs";
// 2. External deps
import express from "express";
// 3. Internal modules (aliased)
import { db } from "@/db";
// 4. Relative
import { helper } from "./utils";
// 5. Types (isolated)
import type { User } from "@/types";
```

## Utility Types
```typescript
// ✅ Utility types for code reuse
type Nullable<T> = T | null;
type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type PickByValue<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
```

## Checklist

- [ ] Types explicit on all public APIs
- [ ] No `any` — use `unknown` and narrow, or generics
- [ ] Runtime validation at API boundaries (Zod/class-validator)
- [ ] Async errors handled — no floating promises
- [ ] Imports order: built-in → external → internal → type files
- [ ] No `console.log` committed — use proper logger
- [ ] `interface` for object shapes, `type` for unions/utilities
