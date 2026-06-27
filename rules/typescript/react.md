---
paths:
- "**/*.tsx"
- "**/*.jsx"
---

# React (Web) Best Practices

> This file extends [common/coding-standards.md](../common/coding-standards.md) with React-specific rules.

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

## Server Components (React 19+)
```tsx
// ✅ Default to Server Components (no "use client")
async function ProductPage({ id }: { id: string }) {
  const product = await db.product.findUnique({ where: { id } });
  return <div>{product.name}</div>;
}

// ❌ Only add "use client" when needed: useState, useEffect, event handlers, browser APIs
"use client";
function AddToCart({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);
  return <button onClick={() => setAdded(true)}>{added ? 'Added' : 'Add to Cart'}</button>;
}
```

## Hooks (React 19+)
```tsx
import { use, useActionState, useOptimistic } from "react";

// ✅ use() for promises and context
function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise);
  return <div>{comments.map(c => <p key={c.id}>{c.text}</p>)}</div>;
}

// ✅ useActionState for form handling
function CreateUser() {
  const [state, formAction, pending] = useActionState(
    async (prev: State, formData: FormData) => { /* mutation */ },
    { error: null }
  );
  return <form action={formAction}>...</form>;
}

// ✅ useOptimistic for instant UI updates
function LikeButton({ likes }: { likes: number }) {
  const [optimisticLikes, addOptimistic] = useOptimistic(likes);
  return <button onClick={() => addOptimistic((prev) => prev + 1)}>{optimisticLikes}</button>;
}
```

## Component Library
- **shadcn/ui** for copy-paste components (Tailwind-based, customizable)
- Or **Radix UI** primitives for custom implementations
- Avoid heavy component libraries (MUI, Antd) unless project already uses them

## File Structure
```
components/
├── ui/          ← shared primitives (Button, Input, Dialog)
├── feature/     ← feature-specific (UserCard, OrderForm, ProductList)
└── layout/      ← layout components (Header, Sidebar, Navbar)

lib/
├── utils.ts     ← shared utilities (cn, formatDate)
├── validations/ ← Zod schemas
└── api/         ← API client / fetch wrappers
```

## Checklist

- [ ] Server Components by default — `"use client"` only when needed
- [ ] Props typed with explicit `interface` or `type`
- [ ] No `React.FC` without a specific reason
- [ ] Hooks for logic reuse, not HOCs
- [ ] Zustand for global state, TanStack Query for server state
- [ ] `React.memo` on expensive renders only
- [ ] Components colocated by feature, not by type