# PHP Coding Standards

## Strict Types
```php
// ✅ Always enable
declare(strict_types=1);

// ❌ Bad
function add($a, $b) { return $a + $b; }

// ✅ Good
function add(int $a, int $b): int { return $a + $b; }
```

## Error Handling
```php
// ❌ Bad — silent
try { risky(); } catch (\Exception $e) {}

// ✅ Good — explicit
try {
    risky();
} catch (\Exception $e) {
    logger->error('risky failed', ['error' => $e->getMessage()]);
    throw $e;
}
```

## PSR Standards
```php
// ✅ PSR-4 autoloading
// ✅ PSR-12 code style
// ✅ Constructor promotion
class UserController {
    public function __construct(
        private UserService $service
    ) {}
}
```

## No Globals
```php
// ❌ Bad
global $db;

// ✅ Good — DI
class Handler {
    public function __construct(private Database $db) {}
}
```
