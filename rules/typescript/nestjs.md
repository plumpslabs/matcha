---
paths:
- "**/*.ts"
---

# NestJS Best Practices

> This file extends [common/coding-standards.md](../common/coding-standards.md) with NestJS-specific rules.

## Modules
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```
- Feature modules per domain, not per file type
- SharedModule for cross-cutting (guards, interceptors)

## Dependency Injection
```typescript
// ✅ constructor injection with @Injectable()
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private mailer: MailerService,
  ) {}
}
// ✅ custom provider
{ provide: 'CONFIG', useFactory: () => loadConfig() }
```

## Validation & DTO
```typescript
export class CreateUserDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(3) name!: string;
}
```
- `class-validator` + `ValidationPipe` (global)
- DTO in controller layer, entity in service layer

## Architecture
```
controller → service → repository
          ↕          ↕
        dto        entity
```
- Controllers: HTTP concerns only (parse request, validate, return response)
- Services: business logic, orchestration
- Repositories: data access (TypeORM / Prisma)
- Guards for auth, Interceptors for logging/transformation, Pipes for validation

## Testing
```typescript
// ✅ TestingModule for isolated service tests
import { Test, TestingModule } from '@nestjs/testing';

describe('UserService', () => {
  let service: UserService;
  let repo: MockType<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useFactory: mockRepository },
      ],
    }).compile();
    service = module.get(UserService);
    repo = module.get(getRepositoryToken(User));
  });
});
```

## Custom Decorators
```typescript
// ✅ Combined decorator
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';

export function Auth(role: Role) {
  return applyDecorators(
    SetMetadata('role', role),
    UseGuards(AuthGuard, RolesGuard),
  );
}
```

## Lifecycle
- `OnModuleInit` for startup logic (cache warmup, connection check)
- `OnModuleDestroy` for cleanup (close connections, flush queues)
- `OnApplicationShutdown` for graceful shutdown (signal handling)

## Circular Dependencies
- Use `forwardRef(() => ModuleB)` in module imports
- Or restructure: extract shared logic into a shared module
- Avoid bidirectional module dependencies where possible

## Performance
- Enable compression (`@nestjs/platform-express` → compression middleware)
- Use caching (`@nestjs/cache-manager` + Redis)
- Serialization: `@SerializeOptions` / `ClassSerializerInterceptor`
- Queue heavy tasks with `@nestjs/bull` + Redis

## Checklist

- [ ] Feature modules per domain, not per file type
- [ ] Controllers: HTTP concerns only — no business logic
- [ ] Services: business logic — no HTTP awareness
- [ ] DTOs at controller boundary, entities in service layer
- [ ] Global ValidationPipe with class-validator
- [ ] `@ControllerAdvice` for global exception handling
- [ ] Constructor injection with `final` fields (no field injection)
- [ ] `forwardRef` only as last resort — prefer shared module