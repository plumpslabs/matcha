---
paths:
- "**/*.py"
---

# Python Coding Standards

> This file extends [common/coding-standards.md](../common/coding-standards.md) with Python-specific rules.

## Type Hints
```python
# ❌ Bad — no type hints
def process(data):
    return data["value"]

# ✅ Good — typed
def process(data: dict[str, Any]) -> str:
    return str(data["value"])

# ✅ Pydantic v2 for data validation
from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: str
    email: EmailStr
    name: str = ""  # default value
    tags: list[str] = []  # typed list
```

## Data Classes
```python
from dataclasses import dataclass, field

# ✅ dataclass for internal data containers (no validation needed)
@dataclass
class Coordinates:
    lat: float
    lng: float
    label: str = ""

# ✅ Path handling with pathlib
from pathlib import Path

BASE_DIR = Path(__file__).parent
config_path = BASE_DIR / "config" / "settings.yaml"
# No more os.path.join, os.path.exists — use Path methods
if config_path.exists():
    content = config_path.read_text()
```

## Error Handling
```python
# ❌ Bad — bare except
try:
    result = risky()
except:
    pass

# ✅ Good — specific
try:
    result = risky()
except ValueError as e:
    logger.error("risky failed", exc_info=e)
    raise
```

## Imports
```python
# 1. Stdlib
import os
from pathlib import Path
# 2. Third-party
import requests
# 3. Internal
from myapp.config import settings
```

## One Function, One Thing
```python
# ❌ Bad
def handle(data):
    validate(data)
    save_to_db(data)
    send_email(data)
    log_activity(data)

# ✅ Good
def create_user(data: dict) -> User:
    user = validate(data)
    return save_to_db(user)
```

## Checklist

- [ ] Type hints on all function signatures (parameters + return)
- [ ] `pathlib.Path` over `os.path` for file operations
- [ ] Pydantic v2 for data validation at boundaries
- [ ] Specific exceptions in `except` blocks — no bare `except:`
- [ ] Imports grouped: stdlib → third-party → internal
- [ ] `dataclasses` for internal data containers
- [ ] No `import *` — explicit imports only
