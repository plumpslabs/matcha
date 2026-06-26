# NestJS Best Practices

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
- Controllers: HTTP concerns only
- Services: business logic
- Repositories: data access (TypeORM / Prisma)
- Guards for auth, Interceptors for logging/transformation