# PHP Patterns

## Architecture
- **Laravel**: skinny controllers, Form Requests for validation, Eloquent for CRUD
- **Symfony**: services as autowired classes, EventDispatcher for decoupling
- **Layered**: `Controller → Service → Repository` — never call ORM from controller
- **Action classes**: single-action controllers for complex operations (Laravel __invoke)

## Modern PHP 8.x
```php
// ✅ Constructor promotion
export class UserService {
    public function __construct(
        private UserRepository $repo,
        private LoggerInterface $logger,
    ) {}
}

// ✅ Enums over class constants
enum UserStatus: string {
    case Active = 'active';
    case Inactive = 'inactive';
}

// ✅ Match expression over switch
$result = match ($status) {
    UserStatus::Active => 'green',
    UserStatus::Inactive => 'gray',
};

// ✅ Named arguments for optional params
new User(name: 'John', email: 'john@example.com');

// ✅ Attributes over docblock annotations
#[Route('/api/users', methods: ['GET'])]
public function index(): JsonResponse {}
```

## Validation
- **Laravel**: Form Request classes for validation + authorization
- **Symfony**: PHP 8 attributes (`#[Assert\NotBlank]`) over deprecated docblock `@Assert` for constraints
- Centralize validation at controller boundary, not scattered in services

## Error Handling
```php
// ✅ Structured error response
try {
    $user = $this->userService->findOrFail($id);
} catch (UserNotFoundException $e) {
    throw new NotFoundException('User not found', previous: $e);
} catch (DatabaseException $e) {
    logger->error('DB error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    throw new InternalServerError('Unable to process request');
}
```

## Testing
- **Pest** (recommended for Laravel) or **PHPUnit**
- HTTP tests for API endpoints
- Database tests with SQLite in-memory or test database
- Mock external services, not internal dependencies
- Factory pattern for test data (Laravel Model Factory)

## Performance
- Eager load relationships (`User::with('posts.comments')`)
- Cache query results (Redis/Memcached) for read-heavy endpoints
- Queue heavy operations (Laravel Jobs / Symfony Messenger)
- Paginate all list endpoints, never `Model::all()`

## Dependency Check
Before adding a Composer package:
1. Search `composer.json` + existing `app/`, `src/` Services
2. Check Packagist for maintenance and PHP version support
3. Evaluate: does Laravel/Symfony already ship this functionality?