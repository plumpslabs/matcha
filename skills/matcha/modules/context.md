---
name: context
version: 4.1.0
description: Living context index — auto-build semantic index from codebase for agent awareness
---

# 🍵 Living Context Index

Static markdown tidak cukup. Agent butuh **dynamic context** yang auto-update saat code berubah.

## Index Files

| File | Isi | Update |
|------|-----|--------|
| `.agents/matcha-index.json` | Module map, exports, deps | Post-write hook |
| `.agents/matcha-arch.json` | Architecture layers | Weekly / manual |
| `.agents/matcha-changes.json` | Recent changes log | Post-write hook |

## matcha-index.json — Module Map

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-08-04T10:00:00Z",
  "modules": {
    "src/core/service.ts": {
      "exports": ["createService", "deleteService"],
      "imports": ["src/db/models.ts", "src/utils/logger.ts"],
      "language": "typescript",
      "lines": 145,
      "lastModified": "2026-08-04T09:30:00Z",
      "riskLevel": "L2",
      "testCoverage": 0.85
    }
  },
  "dependencies": {
    "src/core/service.ts": ["src/db/models.ts", "src/utils/logger.ts"],
    "src/api/routes.ts": ["src/core/service.ts", "src/db/models.ts"]
  },
  "entryPoints": ["src/index.ts", "src/api/routes.ts"],
  "languages": { "typescript": 45, "javascript": 12, "python": 8 }
}
```

## matcha-arch.json — Architecture Layers

```json
{
  "layers": {
    "api": { "files": ["src/api/*.ts"], "risk": "L2" },
    "core": { "files": ["src/core/*.ts"], "risk": "L2" },
    "db": { "files": ["src/db/*.ts"], "risk": "L2" },
    "utils": { "files": ["src/utils/*.ts"], "risk": "L1" },
    "tests": { "files": ["tests/*.ts"], "risk": "L0" }
  },
  "circularDeps": [],
  "godObjects": []
}
```

**Note:** Risk levels per layer come from the active trigger pack, not hardcoded. The above is an example.

## matcha-changes.json — Recent Changes

```json
{
  "changes": [
    {
      "file": "src/core/service.ts",
      "action": "modified",
      "timestamp": "2026-08-04T09:30:00Z",
      "riskLevel": "L3",
      "linesChanged": 15,
      "reviewed": true
    }
  ]
}
```

## Auto-Update Rules

### Post-Write Hook
- Update `matcha-index.json` — tambah/update module info
- Update `matcha-changes.json` — log perubahan
- Detect new files → tambah ke index

### Weekly (Manual)
- Rebuild `matcha-arch.json` — scan architecture
- Detect circular deps
- Detect god objects (>300 LOC, >10 exports)

### On-Demand
- `matcha context rebuild` — force rebuild semua index
- `matcha context show` — tampilkan current index
- `matcha context deps <file>` — trace dependencies

## Integration dengan Agent Chain

```
Scout reads matcha-index.json
  → Knows which files are high-risk
  → Knows dependency graph
  → Knows test coverage

Executor writes file
  → Post-write hook updates index
  → Reviewer reads updated index
  → Next batch uses fresh data
```

## Benefits

| Tanpa Index | Dengan Index |
|-------------|--------------|
| Scout harus scan semua file | Scout baca index, langsung tahu |
| Tidak tahu risk level | Auto-know L0-L3 per file |
| Tidak tahu dependencies | Dependency graph ready |
| Tidak tahu test coverage | Coverage per module |
| Manual architecture review | Auto-detect circular deps |
