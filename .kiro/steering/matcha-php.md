---
description: Matcha PHP coding standards and patterns
inclusion: fileMatch
fileMatchPattern: "*.php"
---

# PHP Standards

## Strict Types
```
declare(strict_types=1);
// ❌ Bad — weak typing
function add($a, $b) { return $a + $b; }
// ✅ Good — typed
function add(int $a, int $b): int { return $a + $b; }
```

## Error Handling
```
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

# 🔎 Reuse check
Before adding composer dep: search composer.json + existing src/
