---
description: Matcha Python coding standards and patterns
globs: ["**/*.py"]
alwaysApply: false
---

# Python Standards

## Type Hints
```python
# ❌ Bad
def process(data): return data["value"]

# ✅ Good
def process(data: dict[str, Any]) -> str:
    return str(data["value"])
```

## Error Handling
```python
# ❌ Bad — bare except
try: result = risky()
except: pass

# ✅ Good — specific
try: result = risky()
except ValueError as e:
    logger.error("failed", exc_info=e)
    raise
```

## Imports
stdlib → third-party → internal

# Python Patterns
- FastAPI for APIs, Pydantic for validation
- Async for I/O-bound, sync for CPU-bound
- Testing: pytest, pytest-asyncio

## Checklist
- [ ] Type hints on all function signatures
- [ ] Pydantic v2 for data validation at boundaries
- [ ] Specific exceptions — no bare `except:`
- [ ] Imports: stdlib → third-party → internal
- [ ] `pathlib.Path` over `os.path`
- [ ] Before adding pip dep: search `requirements.txt` + existing `utils/` first
