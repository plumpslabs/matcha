---
name: orchestration
version: 4.1.0
description: Sub-agent orchestration for large tasks — scout, plan, execute, review, verify
---

# 🍵 Sub-Agent Orchestration

Untuk task besar (>20 files atau >500 LOC), gunakan **agent chain** — bukan satu agent untuk semua.

## Agent Chain

```
Scout → Planner → Executor → Reviewer → Verifier
  │        │          │          │          │
  └─ read  └─ plan    └─ write   └─ attack  └─ test
```

### 1. Scout (Read-Only)
- **Tugas:** Explore codebase, find dependencies, map architecture
- **Tools:** Read, Grep, Glob — TIDAK BOLEH write
- **Output:** Dependency map + risk assessment
- **Trigger:** Setiap task baru yang melibatkan >5 files

### 2. Planner (Read + Plan)
- **Tugas:** Buat plan file-by-file, step-by-step
- **Tools:** Read, Grep, Glob, Write (plan file only)
- **Output:** `.agents/matcha-plan.md` dengan 5W1H
- **Trigger:** Setelah Scout selesai

### 3. Executor (Write)
- **Tugas:** Implement plan satu file per time
- **Tools:** Read, Write, Edit, Bash (limited)
- **Output:** Kode yang diimplement
- **Trigger:** Setelah Planner selesai, file-by-file

### 4. Reviewer (Read + Attack)
- **Tugas:** Review semua perubahan secara adversarial
- **Tools:** Read, Grep, Glob — TIDAK BOLEH write
- **Output:** Issue list dengan severity
- **Trigger:** Setelah Executor selesai semua files

### 5. Verifier (Bash)
- **Tugas:** Run tests, typecheck, lint
- **Tools:** Bash (test commands only)
- **Output:** PASS/FAIL + metrics
- **Trigger:** Setelah Reviewer PASS

## Orchestration Rules

### Parallel vs Sequential

| Kondisi | Strategy |
|---------|----------|
| Files independent | **Parallel** — executor bisa kerja bareng |
| Files dependent | **Sequential** — satu per satu, test setelah setiap batch |
| Risk level L3 | **Sequential + Review per batch** |
| Risk level L0-L1 | **Parallel** — less overhead |

### Batch Sizing

| Codebase Size | Batch Size | Review Frequency |
|---------------|------------|------------------|
| < 1k LOC | 1 batch | Sekali di akhir |
| 1k-10k LOC | 5-10 files/batch | Per batch |
| 10k-100k LOC | 10-20 files/batch | Per batch + final |
| > 100k LOC | 5-10 files/batch | Per batch mandatory |

### Escalation

```
Reviewer menemukan CRITICAL issue?
  → STOP executor
  → Return ke Planner untuk re-plan
  → Scout verify impact
  → Resume setelah plan diupdate
```

### Failure Recovery

```
Executor gagal (syntax error, test fail)?
  → Auto-retry 1x dengan fix
  → Jika masih gagal → STOP, return ke Planner
  → Log error di metrics
```

## When to Use Orchestration

| Kondisi | Gunakan? |
|---------|----------|
| Task < 5 files | ❌ Overhead — langsung executor |
| Task 5-20 files | ⚠️ Optional — tergantung complexity |
| Task > 20 files | ✅ Mandatory |
| Risk level L3 | ✅ Mandatory (whatever the trigger pack defines as high-risk) |
| Legacy code > 500 LOC | ✅ Mandatory |

## Contoh Output

```
🍵 orchestration: task detected — 15 files, L2 risk
  1. Scout: mapping dependencies... done (12 deps found)
  2. Planner: creating plan... done (.agents/matcha-plan.md)
  3. Executor: batch 1/3 (5 files)... done
  4. Reviewer: reviewing batch 1... 2 warnings found
  5. Executor: batch 2/3 (5 files)... done
  6. Reviewer: reviewing batch 2... PASS
  7. Executor: batch 3/3 (5 files)... done
  8. Reviewer: final review... PASS
  9. Verifier: running tests... 353/353 PASS

  ✅ Task complete — 15 files, 0 critical, 2 warnings
```
