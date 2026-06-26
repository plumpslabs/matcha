# TanStack Best Practices

## TanStack Query (React Query)
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ✅ Query
function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => api.getUser(id),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// ✅ Mutation with optimistic update
function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: User) => api.updateUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
```
- Always type `queryKey` and `queryFn` — no `any`
- `staleTime` over `refetchInterval` for polling

## Query Key Factory
```typescript
export const userKeys = {
  all:    ['users'] as const,
  lists:  () => [...userKeys.all, 'list'] as const,
  list:   (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details:() => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};
// Usage: queryKey: userKeys.detail(id)
```

## Mutations with Optimistic Update
```typescript
function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: User) => api.updateUser(data),
    onMutate: async (newUser) => {
      await qc.cancelQueries({ queryKey: userKeys.detail(newUser.id) });
      const previous = qc.getQueryData(userKeys.detail(newUser.id));
      qc.setQueryData(userKeys.detail(newUser.id), newUser);
      return { previous }; // for rollback
    },
    onError: (err, newUser, context) => {
      qc.setQueryData(userKeys.detail(newUser.id), context?.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}
```

## Infinite Queries
```typescript
function useInfiniteProducts() {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite'],
    queryFn: ({ pageParam = 0 }) => api.getProducts({ offset: pageParam, limit: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}
```

## Query Cancellation
```typescript
const query = useQuery({
  queryKey: ['products'],
  queryFn: ({ signal }) => fetch('/api/products', { signal }).then(r => r.json()),
});
// TanStack Query auto-aborts when query becomes stale/unmounted
```

## TanStack Router
```typescript
import { createRouter, Route } from "@tanstack/react-router";

// ✅ Type-safe routes
const productRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/products/$productId",
  validateSearch: (s: Record<string, unknown>) => ({ page: Number(s.page ?? 1) }),
  loader: ({ params: { productId } }) => fetchProduct(productId),
});
```
- Use `loader` for data fetching (integrated with Query)
- Type-safe search params with `validateSearch`
- Route masks for URL aliasing

## TanStack Start
- Full-stack React: file-based routing + server functions
- Server functions: `"use server"` with type-safe client calls
- SSR + streaming by default
- Deploy: Vercel, Netlify, Cloudflare
