---
description: Matcha Angular coding standards
globs: ["**/*.ts"]
alwaysApply: false
---

# Angular Standards

## Signals over RxJS (Angular 17+)
- signal() for UI state, computed() for derived
- RxJS only for event streams (debounce, merge)
- OnPush change detection on all components

## Dependency Injection
- `inject()` over constructor (tree-shakable)
- InjectionToken for non-class providers
- `providedIn: 'root'` for singletons

## File Naming
kebab-case with type suffix: `.component.ts`, `.service.ts`
1 class = 1 file

## Performance
- `ChangeDetectionStrategy.OnPush`
- `trackBy` in @for loops
- `async` pipe in templates, never subscribe in component

# 🔎 Reuse check
Check existing services before adding new ones