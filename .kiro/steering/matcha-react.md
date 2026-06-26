---
description: Matcha React (web) coding standards and patterns
inclusion: fileMatch
fileMatchPattern: "*.tsx|*.jsx"
---

# React Standards

## Components
- One component = one file (PascalCase)
- Composition over inheritance
- Props interface before component

## State
- Zustand for global, useState for local
- TanStack Query for server state

## Performance
- React.memo, useCallback, useMemo
- Virtualize long lists

## Signals (React 19+)
- useSignal() for reactive state
- use() for promise resolution

# 🔎 Reuse check
Search existing components before creating new ones
