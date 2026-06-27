---
paths:
- "**/*.py"
---

# Python Patterns

> This file extends [common/coding-standards.md](../common/coding-standards.md) with Python architecture and design patterns.

## Architecture
- **FastAPI**: dependency injection via `Depends`, Pydantic v2 for validation, async handlers
- **Django**: fat models → thin views → serializers for API boundary
- **Layered**: `routes/api → services → repositories` (FastAPI)
- **Modular**: split by domain/feature, not by file type

## Data & Validation
- **Pydantic v2** for all data validation at API/service boundaries
- `dataclasses` for internal data containers (stdlib, no overhead)
- `pathlib.Path` over `os.path` for file paths
- Typed dicts for dictionary schemas (`TypedDict`)

## Async Patterns
```python
# ✅ Proper task management
import asyncio

async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch_data())
        task2 = tg.create_task(process_data())
    # Both done here, errors propagate
```
- Use `asyncio.TaskGroup` (Python 3.11+) over `asyncio.gather`
- Never fire-and-forget: always await or create_task with error handling
- `asyncio.timeout()` for cancellation, not manual cancellation patterns

## Error Handling
```python
# ✅ Specific exceptions with context
try:
    result = await risky()
except ValueError as e:
    logger.error("Invalid input", exc_info=e, extra={"input": data})
    raise HTTPException(status_code=400, detail=str(e))
except DatabaseError as e:
    logger.critical("DB unavailable", exc_info=e)
    raise HTTPException(status_code=503)
```

## Testing
- **pytest** + **coverage** for all testing
- **factory_boy** for test fixtures (Django/ORM models)
- **httpx** + `AsyncClient` for FastAPI integration tests
- **pytest-asyncio** for async test support
- **freezegun** for time-dependent tests
- `conftest.py` for shared fixtures, `pytest.ini` for config

## Module Structure
```
myapp/
├── __init__.py
├── main.py          ← app entry
├── config.py        ← settings (pydantic-settings)
├── api/
│   ├── __init__.py
│   └── v1/
│       ├── users.py
│       └── products.py
├── domain/
│   ├── models.py    ← Pydantic models
│   └── services.py
└── infrastructure/
    ├── database.py
    └── cache.py
```

## Dependency Check
Before adding a pip package:
1. Search `requirements.txt` / `pyproject.toml` + existing `lib/`, `utils/`
2. Check PyPI for maintenance status (last release, Python version support)
3. Prefer stdlib + Pydantic over dedicated packages for simple needs

## Checklist

- [ ] Architecture: routes/api → services → repositories (FastAPI) or fat models → thin views (Django)
- [ ] Pydantic v2 for validation at API boundaries
- [ ] `asyncio.TaskGroup` (3.11+) over `asyncio.gather`
- [ ] `pytest` + `coverage` for testing
- [ ] `conftest.py` shared fixtures in test packages
- [ ] Testcontainers or httpx AsyncClient for integration tests
- [ ] `factory_boy` for test fixtures (Django/ORM)