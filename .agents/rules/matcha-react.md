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
- React Context only for theme/auth

## Performance
- `React.memo` for expensive renders
- `useCallback` / `useMemo` for stable references
- Virtualize long lists (react-window)

## Signals (React 19+)
```tsx
import { use, useSignal } from "react";
const count = useSignal(0);
```

# 🔎 Reuse check
Search existing components before creating new ones
