---
paths:
- "**/*.ts"
- "**/*.tsx"
---

# TypeScript Patterns

> This file extends [common/coding-standards.md](../common/coding-standards.md) with TypeScript architecture and design patterns.

## Architecture
- **Layered**: `controller → service → repository` separation
- **Clean Architecture**: domain entities innermost, framework outermost
- **Feature-based**: colocate by feature/module, not by file type

## State Management
- **Zustand** for global client state (existing in project)
- **TanStack Query** for server state (cache, sync, mutations)
- Local state with `useState` / `useReducer` — context for DI, not state

## API & Data Layer
- Typed fetch wrapper with Zod validation at boundaries
- Error boundaries at route/page level, not per component
- Repository pattern: abstract data source behind interface

## Error Handling
- Custom error classes extending `Error`
- Never `try/catch` without logging or rethrow
- Global error boundary for unhandled exceptions
- API errors: consistent `{ error, message, statusCode }` shape

## Testing
- **Vitest** + **Testing Library** for unit/integration
- **MSW** for API mocking (service worker, not jest.mock)
- **Playwright** for e2e (critical paths only)
- Test behavior, not implementation — avoid testing mocks

## Monorepo
- Turborepo or Nx for build orchestration
- Shared `typescript-config`, `eslint-config` packages
- Package isolation: each package owns its dependencies

## Validation
- **Zod** for runtime validation at API boundaries
- DTO validation in controller layer, not service layer
- Domain validation in entity/domain layer (always enforced)

## Dependency Check
Before adding an npm package:
1. Search `package.json` + existing `utils/`, `lib/` for existing implementation
2. Search bundlephobia for size impact
3. Can stdlib do it? 3 use cases before abstracting

## Checklist

- [ ] Architecture follows layered pattern (controller → service → repository)
- [ ] DTOs/validation at API boundaries, not scattered in services
- [ ] Error handling consistent — custom errors, never silent catch
- [ ] State management: Zustand for client, TanStack Query for server
- [ ] API mocking via MSW for integration tests
- [ ] New dependency justified — checked bundlephobia, existing alternatives