---
paths:
- "**/*.ts"
---

# Angular Best Practices

> This file extends [common/coding-standards.md](../common/coding-standards.md) with Angular-specific rules.

## Signals (Angular 17+)
```typescript
import { signal, computed, effect } from '@angular/core';

// ✅ signal over BehaviorSubject
const count = signal(0);
const doubled = computed(() => count() * 2);
effect(() => console.log('count:', count()));

@Component({ template: `<p>{{ count() }}</p>` })
export class MyComponent { count = signal(0); }
```
- `signal()` for state, `computed()` for derived, `effect()` for side effects
- Prefer signals over RxJS for UI state
- Keep RxJS for event streams (debounce, merge)

## Dependency Injection
```typescript
// ✅ constructor injection with inject()
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
}
```
- `inject()` over constructor DI (tree-shakable)
- `providedIn: 'root'` for singletons
- Use InjectionToken for non-class dependencies

## File Naming
```
kebab-case:
  user-list.component.ts
  user-list.service.ts
  user-list.routes.ts
  auth.guard.ts
  user.model.ts
```
- 1 class = 1 file
- `.component.ts`, `.service.ts`, `.pipe.ts`, `.guard.ts`, `.directive.ts`

## Performance
- `ChangeDetectionStrategy.OnPush` on all components
- `trackBy` in `@for` loops (Angular 17+)
- Lazy load feature modules / standalone components
- `async` pipe in templates, never `subscribe` in component

## Checklist

- [ ] Signals over RxJS for UI state
- [ ] `inject()` over constructor DI
- [ ] `ChangeDetectionStrategy.OnPush` on all components
- [ ] `trackBy` in `@for` loops
- [ ] Lazy load feature modules / standalone components
- [ ] One class = one file
- [ ] `.service.ts`, `.component.ts`, `.pipe.ts` suffixes consistently used