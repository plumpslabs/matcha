---
description: Matcha TanStack (Query, Router, Start) coding standards
globs: ["**/*.{ts,tsx}"]
alwaysApply: false
---

# TanStack Standards

## TanStack Query
```typescript
function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => api.getUser(id),
    staleTime: 5 * 60 * 1000,
  });
}
```
- Type queryKey + queryFn always
- staleTime over refetchInterval
- Optimistic: onMutate → onError → onSettled

## TanStack Router
- Type-safe routes with validateSearch
- Loader integrated with Query

## TanStack Start
- Server functions with "use server"
- SSR + streaming by default

# 🔎 Reuse check
Search existing query hooks before adding new ones
