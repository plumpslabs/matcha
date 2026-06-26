---
description: Matcha Python coding standards and patterns
inclusion: fileMatch
fileMatchPattern: "*.py"
---

# Python Standards

## Type Hints
```
# ❌ Bad
def process(data): return data["value"]
# ✅ Good
def process(data: dict[str, Any]) -> str:
    return str(data["value"])
```

## Error Handling
```
# ❌ Bad — bare except
try: result = risky()
except: pass
# ✅ Good — specific
try: result = risky()
except ValueError as e:
    logger.error("failed", exc_info=e); raise
```

## Imports
stdlib → third-party → internal

# Python Patterns
- FastAPI for APIs, Pydantic for validation
- Async for I/O-bound, sync for CPU-bound
- Testing: pytest, pytest-asyncio

# 🔎 Reuse check
Before adding pip dep: search requirements.txt + existing utils/
