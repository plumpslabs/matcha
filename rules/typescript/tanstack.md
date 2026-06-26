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
- Always type `queryKey` and `queryFn`
- `staleTime` over `refetchInterval` for polling
- Separate query keys: `["entity"]`, `["entity", id]`, `["entity", { filters }]`
- `placeholderData: keepPreviousData` for pagination
- Mutations: `onMutate` (optimistic) → `onError` (rollback) → `onSettled` (refetch)

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
