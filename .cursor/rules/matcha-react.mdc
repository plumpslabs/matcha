---
description: Matcha React (web) coding standards and patterns
globs: ["**/*.{tsx,jsx}"]
alwaysApply: false
---

# React Standards

## Components
- One component = one file (PascalCase)
- Composition over inheritance
- Props interface before component definition

## State
- Zustand for global, useState for local
- TanStack Query for server state
- Context only for truly global concerns (theme, auth)

## Performance
- `React.memo` for expensive renders
- `useCallback` for stable function references
- `useMemo` for derived data (not premature optimization)
- Virtualize long lists via `react-window`

## Signals (React 19+)
```tsx
import { use, useSignal } from "react";
const count = useSignal(0);
```

## Checklist
- [ ] Server Components by default — `"use client"` only when needed
- [ ] Props typed with explicit interface/type
- [ ] Hooks for logic reuse, not HOCs
- [ ] Zustand for global state, TanStack Query for server state
- [ ] `React.memo` on expensive renders only
- [ ] Before adding React dep: search `package.json` + existing `components/` first
