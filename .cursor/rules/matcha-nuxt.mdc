---
description: Matcha Nuxt coding standards
globs: ["**/*.{vue,ts}"]
alwaysApply: false
---

# Nuxt Standards

## Directory Structure
- `pages/` → file-based routing
- `components/` → auto-imported
- `composables/` → auto-imported (useXxx)
- `server/` → API routes
- `middleware/` → route guards

## Data Fetching
```typescript
const { data } = await useAsyncData('key', () => $fetch('/api/data'));
const { data } = await useFetch('/api/data');
```
- useAsyncData / useFetch over raw fetch (SSR hydration)
- useLazyAsyncData for non-blocking

## Auto-imports
- Composables in composables/ → auto-imported
- Components in components/ → auto-imported
- No manual imports needed (tree-shaken at build)

## Checklist
- [ ] `useAsyncData` / `useFetch` over raw `fetch` (SSR hydration)
- [ ] Auto-imported composables in `composables/`
- [ ] Server routes in `server/api/` — server-only code
- [ ] Route rules in `nuxt.config.ts` (SSR, SPA, prerender)
- [ ] SEO via `useSeoMeta` per page
- [ ] Check `nuxt.config.ts` plugins before adding Nuxt modules
