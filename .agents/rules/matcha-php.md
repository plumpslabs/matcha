---
description: Matcha PHP coding standards and patterns
globs: ["**/*.php"]
alwaysApply: false
---

# PHP Standards

## Strict Types
```php
declare(strict_types=1);

// ❌ Bad — weak typing
function add($a, $b) { return $a + $b; }

// ✅ Good — typed
function add(int $a, int $b): int { return $a + $b; }
```

## Error Handling
```php
// ❌ Bad — silent
try { risky(); } catch (\Exception $e) {}

// ✅ Good — explicit
try { risky(); }
catch (\Exception $e) {
    logger->error('failed', ['error' => $e->getMessage()]);
    throw $e;
}
```

## PSR Standards
PSR-4 autoloading, PSR-12 code style, constructor promotion

# PHP Patterns
- MVC with service layer
- Repository pattern for data access
- Testing: PHPUnit, Pest
- DI over service location

## Checklist
- [ ] `declare(strict_types=1)` on every PHP file
- [ ] Types on all parameters and return values
- [ ] Modern PHP 8.x features (enums, match, named arguments)
- [ ] Constructor property promotion where applicable
- [ ] Specific exceptions caught — no empty catch blocks
- [ ] PSR-4 autoloading, PSR-12 code style
- [ ] Before adding composer dep: search `composer.json` + existing `src/` first
