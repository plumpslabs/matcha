---
description: Matcha NestJS coding standards
inclusion: fileMatch
fileMatchPattern: "*.ts"
---

# NestJS Standards

## Modules & DI
- Feature modules per domain
- @Injectable() + constructor injection
- Custom providers with useFactory

## Architecture
controller → service → repository
- Controllers: HTTP, Services: logic, DTOs: validation

## Validation
- Global ValidationPipe + class-validator
- Guards for auth, Interceptors for logging

# 🔎 Reuse check
Check module providers before adding new ones
