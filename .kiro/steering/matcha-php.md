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

## Checklist
- [ ] `declare(strict_types=1)` on every file
- [ ] Types on all params and returns
- [ ] PHP 8.x features: enums, match, named args
- [ ] Specific exceptions — no empty catch
- [ ] PSR-4 + PSR-12
- [ ] Before adding dep: search `composer.json` + `src/` first
