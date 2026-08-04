---
name: flow
version: 2.4.0
description: TDD flow + iterative loop mode for complex tasks
---

# 🍵 matcha — Flow Modes

Two execution modes for different task types.

---

## TDD Mode

When user requests TDD or task is safety-critical:

```
Red (write failing test) → Green (minimum code to pass) → Refactor → Verify
```

### Flow

1. **RED** — Write a failing test that describes expected behavior
2. **GREEN** — Write minimum code to make the test pass. No extras.
3. **REFACTOR** — Clean up while keeping tests green
4. **VERIFY** — Run full test suite, confirm no regressions

### When to Use

- User explicitly requests TDD
- Safety-critical code (auth, payments, data integrity)
- Complex business logic with edge cases
- Bug fix — write regression test first

### Rules

- Test names describe behavior, not implementation
- One assertion per test when possible
- Tests must be deterministic (no flaky tests)
- Mock at boundaries, not internals

---

## Loop Mode

For tasks requiring >3 steps or touching multiple files:

```
Goal → Act → Observe → Verify → (Pass? Done | Fail? → Retry/Loop/Escalate)
```

### Phases

| Phase | Description |
|-------|-------------|
| **ACT** | Implement code changes based on goal |
| **OBSERVE** | Check compile, lint, test results |
| **VERIFY** | Run against success criteria |

### Conditions

| Condition | Action |
|-----------|--------|
| All success | Done. Report summary. |
| Max iterations reached | Escalate to human. Report progress. |
| Stuck (no progress after N iter) | Escalate. |

### Task Complexity Detection

- >3 steps → suggest loop mode
- Multiple files touched → auto loop
- Simple task (rename, typo) → linear mode

### Loop Budget

- Max 5 iterations before escalation
- Each iteration must show measurable progress
- If iteration N produces same error as N-1 → escalate immediately
