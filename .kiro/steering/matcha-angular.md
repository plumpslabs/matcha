---
description: Matcha Angular coding standards
inclusion: fileMatch
fileMatchPattern: "*.ts"
---

# Angular Standards

## Signals over RxJS (Angular 17+)
- signal() for UI state, computed() for derived
- RxJS only for event streams
- OnPush change detection on all components

## Dependency Injection
- inject() over constructor
- providedIn: 'root' for singletons
- InjectionToken for non-class providers

## File Naming
- kebab-case with type suffix (.component.ts, .service.ts)

## Performance
- OnPush, trackBy in @for, async pipe

# 🔎 Reuse check
Check existing services before adding new ones
