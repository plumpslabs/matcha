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

## Checklist
- [ ] Server Components by default — `"use client"` only when needed
- [ ] Props typed with interface/type
- [ ] Hooks for logic reuse, not HOCs
- [ ] Zustand for global, TanStack Query for server
- [ ] `React.memo` on expensive renders only
- [ ] Search existing components before creating new ones
