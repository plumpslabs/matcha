# PHP Coding Standards

## Strict Types
```php
// ✅ Always enable on every PHP file
declare(strict_types=1);

// ❌ Bad — no types, type coercion
function add($a, $b) { return $a + $b; }

// ✅ Good — typed parameters and return
export function add(int $a, int $b): int { return $a + $b; }
```

## Modern PHP 8.x Features
```php
// ✅ Enums over class constants
enum UserStatus: string {
    case Active = 'active';
    case Inactive = 'inactive';
    case Banned = 'banned';

    public function label(): string {
        return match ($this) {
            self::Active => 'Active User',
            self::Inactive => 'Inactive User',
            self::Banned => 'Banned User',
        };
    }
}

// ✅ Match expression (replaces switch with type safety)
$status = match ($user->role) {
    'admin' => 'red',
    'editor' => 'green',
    'viewer' => 'gray',
    default => 'unknown',
};

// ✅ Named arguments (PHP 8.0+)
new User(
    name: 'John',
    email: 'john@example.com',
    active: true,
);

// ✅ Attributes over docblock annotations (PHP 8.0+)
#[Route('/api/users', methods: ['GET'])]
#[Middleware('auth')]
public function index(): JsonResponse {}

// ✅ Constructor property promotion
class UserController {
    public function __construct(
        private UserService $service,
        private LoggerInterface $logger,
    ) {}
}

// ✅ Union types
function setId(int|string $id): void { /* ... */ }
```

## Error Handling
```php
// ❌ Bad — silent, empty catch
try { risky(); } catch (\Exception $e) {}

// ✅ Good — specific with logging
try {
    risky();
} catch (ValidationException $e) {
    // Expected validation error — return user feedback
    return response()->json(['error' => $e->getMessage()], 422);
} catch (\Exception $e) {
    // Unexpected error — log and rethrow
    logger->error('risky failed', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
    ]);
    throw $e;
}
```

## PSR Standards
```php
// ✅ PSR-4 autoloading (namespace ←→ directory)
// ✅ PSR-12 code style (braces, spacing, visibility)
// ✅ PSR-3 logger interface
// ✅ PSR-7 HTTP message interfaces (Request/Response)
```

## No Globals
```php
// ❌ Bad — global variable + global function
function getDb() {
    global $db;
    return $db;
}

// ✅ Good — dependency injection via constructor
class UserRepository {
    public function __construct(
        private Database $db,
    ) {}
}
```
