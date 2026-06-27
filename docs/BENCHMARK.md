# 🍵 matcha Benchmark Report

> Focus: Real-world multi-turn feature implementation & matcha comparison
> Generated: 2026-06-27

---

## Real Multi-Turn Benchmark

**Setup**: Express API project &middot; 3 features × 3 steps each &middot; agy (Gemini 3.5 Flash)
**Matcha**: Full `.claude/` + `hooks/` + `rules/` injected

### Results

| Feature | LOC | Tests | Passed |
|---------|:---:|:-----:|:------:|
| Activity Tracking | 111 | 12 | ✅ 12 |
| Pagination | 67 | 10 | ✅ 10 |
| Rate Limiting | 75 | 8 | ✅ 8 |
| **Total** | **270** | **30** | **✅ 30/30** |

### Matcha Compliance

All 3 features scored **A** for matcha compliance:
- Named constants for HTTP status codes and configuration
- Separate validation/utility functions
- Explicit, descriptive error messages
- Environment variable configuration
- No debug code or console.log leftovders
- No regression — existing tests still pass

---

## Simple Prompt Test — Matcha vs No Matcha

**Setup**: Same project, same prompt `"Add an activity endpoint"` (no detail)
**Backend**: agy (Gemini 3.5 Flash) &middot; 12 tests each

### Results

| Criterion | 🍵 WITH Matcha | ❌ WITHOUT Matcha |
|-----------|:--------------:|:-----------------:|
| Tests Passed | 12/12 | 12/12 |
| LOC | 80 | 69 |
| Status Codes | `STATUS_CREATED`, `STATUS_BAD_REQUEST` | Hardcoded `404`, `400`, `201` |
| Error Message | `"Action must be a non-empty string"` | `"Invalid input"` (generic) |
| Validation | Separate `validateActivityInput()` | Separate function |
| Data Structure | Per-user `activitiesStore = {}` | Flat `activities = []` array |

### Key Insight

> **Matcha value is most visible when the prompt is vague.**
>
> With a minimal prompt like `"Add an activity endpoint"`, matcha's CLAUDE.md rules guide the AI toward:
> - **Named constants** instead of hardcoded magic numbers
> - **Explicit, descriptive error messages** instead of generic ones
> - **Better data structures** (keyed by user ID vs flat array)
>
> Trade-off: Matcha generates ~16% more LOC (+11 lines) — the cost of maintainable, production-ready code.

---

## Methodology

- **Tasks**: Real-world multi-turn feature implementation (Express API)
- **Backend**: agy (Gemini 3.5 Flash) — interactive mode
- **Matcha**: Full injection (`.claude/`, `hooks/`, `rules/`, `skills/`, `.agents/`)
- **Metrics**: Test pass rate, LOC, code quality indicators (named constants, error messages, function structure)
- **Comparison**: Same prompt with and without matcha files in project

---

*Report compiled manually via real benchmark execution*
