# Nuxt Best Practices

## Directory Structure
```
pages/       ← file-based routing
components/  ← auto-imported components
composables/ ← auto-imported composables (useXxx)
server/      ← server routes + API
middleware/  ← route middleware
layers/      ← shared layers
```

## Composables
```typescript
// composables/useCounter.ts — auto-imported
export const useCounter = () => {
  const count = ref(0);
  const increment = () => count.value++;
  return { count, increment };
};
```

## Data Fetching
```typescript
// ✅ useAsyncData for SSR-safe fetching
const { data: user } = await useAsyncData("user", () => $fetch("/api/user"));
// ✅ useFetch — convenience wrapper
const { data: posts } = await useFetch("/api/posts");
// ❌ Avoid raw fetch() — breaks SSR hydration
```
- `useAsyncData` + `useFetch` over raw `fetch` (SSR hydration)
- `key` parameter for deduplication
- `useLazyAsyncData` for non-blocking

## Performance
- `NuxtImage` / `NuxtImg` for optimized images
- Route transitions with `<NuxtPage transition="..." />`
- `keepalive: true` for cached pages
- Lazy hydrate components with `lazy` prefix

## Auto-imports
- Composables in `composables/` → auto-imported
- Components in `components/` → auto-imported
- No manual import needed (tree-shaken at build)
