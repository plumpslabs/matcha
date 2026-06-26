# Python Coding Standards

## Type Hints
```python
# ❌ Bad
def process(data):
    return data["value"]

# ✅ Good
from typing import Any
def process(data: dict[str, Any]) -> str:
    return str(data["value"])
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
