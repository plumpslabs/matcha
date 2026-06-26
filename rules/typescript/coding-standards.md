# TypeScript Coding Standards

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
```

## Imports Order
```
// 1. Node built-ins
import { readFile } from "fs";
// 2. External deps
import express from "express";
// 3. Internal modules
import { db } from "@/db";
// 4. Relative
import { helper } from "./utils";
```
