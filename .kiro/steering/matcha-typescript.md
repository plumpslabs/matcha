---
description: Matcha TypeScript/JavaScript coding standards and patterns
inclusion: fileMatch
fileMatchPattern: "*.ts|*.tsx|*.js|*.jsx"
---

# TypeScript Standards

## Strict Mode, No `any`
- Prefer `unknown` + narrow over `any`
- `interface` for public API, `type` for unions

## File Naming
- kebab-case for utils, PascalCase for components
- `.type.ts`, `.hook.ts`, `.ctx.ts` suffixes

## Dependency Injection
- Constructor injection over singleton imports
- Use interfaces/protocols for deps

## Async Safety
- No floating promises — always await or .catch

## Imports
node → externals → internal → relative

# TypeScript Patterns
- Zustand + TanStack Query for state
- Typed fetch wrapper, error boundaries
- Testing: Vitest + Testing Library, MSW

## Checklist
- [ ] Types explicit on public APIs — no `any`
- [ ] Runtime validation at boundaries (Zod)
- [ ] Async errors handled — no floating promises
- [ ] Imports: node → external → internal → relative
- [ ] Before adding dep: search `package.json` + `src/utils/` first
