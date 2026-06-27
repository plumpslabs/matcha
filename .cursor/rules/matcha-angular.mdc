---
description: Matcha Angular coding standards
globs: ["**/*.ts"]
alwaysApply: false
---

# Angular Standards

## Signals over RxJS (Angular 17+)
```typescript
const count = signal(0);
const doubled = computed(() => count() * 2);
```
- signal() for UI state, RxJS only for event streams
- OnPush change detection on all components

## Dependency Injection
```typescript
@Injectable({ providedIn: 'root' })
export class Service { private http = inject(HttpClient); }
```
- `inject()` over constructor for tree-shaking
- InjectionToken for non-class providers

## File Naming
kebab-case with type suffix: `.component.ts`, `.service.ts`, `.pipe.ts`
1 class = 1 file

## Performance
- `ChangeDetectionStrategy.OnPush`
- `trackBy` in @for loops
- `async` pipe in templates, never subscribe in component

## Checklist
- [ ] Signals over RxJS for UI state — RxJS only for event streams
- [ ] `inject()` over constructor DI
- [ ] `ChangeDetectionStrategy.OnPush` on all components
- [ ] `trackBy` in `@for` loops
- [ ] Lazy load feature modules / standalone components
- [ ] `async` pipe in templates, never `subscribe` in component
- [ ] Check existing services and modules before adding new ones
