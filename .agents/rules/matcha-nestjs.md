---
description: Matcha NestJS coding standards
globs: ["**/*.ts"]
alwaysApply: false
---

# NestJS Standards

## Modules & DI
- Feature modules per domain, not per file type
- `@Injectable()` with constructor injection
- Custom providers with useFactory

## Architecture
controller → service → repository
- Controllers: HTTP only
- Services: business logic
- DTOs for validation, entities for data access

## Validation
- Global ValidationPipe with class-validator
- Guards for auth, Interceptors for logging

# 🔎 Reuse check
Check existing providers in module before adding new ones