---
description: Matcha NestJS coding standards
globs: ["**/*.ts"]
alwaysApply: false
---

# NestJS Standards

## Modules & DI
- Feature modules per domain, not per file type
- `@Injectable()` with constructor injection
- Custom providers with useFactory for external services

## Architecture
controller → service → repository
- Controllers: HTTP only
- Services: business logic
- DTOs for validation, entities for data access

## Validation
```typescript
export class CreateUserDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(3) name!: string;
}
```
- Global ValidationPipe with class-validator
- Guards for auth, Interceptors for logging

## Checklist
- [ ] Feature modules per domain, not per file type
- [ ] Controllers: HTTP only — no business logic
- [ ] Services: business logic — no HTTP awareness
- [ ] DTOs at controller boundary, entities in service layer
- [ ] Global ValidationPipe with class-validator
- [ ] `@ControllerAdvice` for global exception handling
- [ ] Check existing providers in module before adding new ones
