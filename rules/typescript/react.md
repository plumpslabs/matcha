# React (Web) Best Practices

## Components
```tsx
type ButtonProps = { variant: "primary" | "secondary"; children: React.ReactNode; };
function Button({ variant, children }: ButtonProps) {
  return <button className={variant}>{children}</button>;
}
```
- One component = one file (PascalCase)
- Composition over inheritance
- Hooks for logic reuse, HOCs only for legacy

## State Management
- Zustand for global, useState for local
- React Query / TanStack Query for server state
- Context only for truly global concerns (theme, auth)

## Performance
```tsx
// ❌ Bad — re-creates on every render
function Component() { const handler = () => {}; return <div onClick={handler} />; }
// ✅ Good — stable reference
function Component() { return <div onClick={useCallback(() => {}, [])} />; }
```
- `React.memo` for expensive renders
- `useMemo` for derived data, not premature optimization
- Virtualize long lists (`react-window`)

## Signals (React 19+)
```tsx
import { use, useSignal } from "react";
// ✅ useSignal for reactive state
const count = useSignal(0);
// ✅ use() for promises
function Comments({ promise }) { const data = use(promise); return <div>{data}</div>; }
```

## File Structure
```
components/
├── ui/          ← shared primitives (Button, Input)
├── feature/     ← feature-specific (UserCard, OrderForm)
└── layout/      ← layout components (Header, Sidebar)
```