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
- Always type queryKey and queryFn
- staleTime over refetchInterval
- Separate query keys: ["entity"], ["entity", id]
- Optimistic: onMutate → onError → onSettled

## TanStack Router
- Type-safe routes with validateSearch
- Loader for data fetching (integrated with Query)
- Route masks for URL aliasing

## TanStack Start
- Server functions with "use server"
- SSR + streaming by default

## Checklist
- [ ] Query keys typed — factory pattern for consistency
- [ ] `staleTime` configured per query (not all default)
- [ ] Mutations with optimistic updates for UX-critical paths
- [ ] Error handling in mutations — rollback on failure
- [ ] Infinite queries paginated with `getNextPageParam`
- [ ] Router: type-safe routes with `validateSearch`
- [ ] Search existing query hooks before adding new ones
