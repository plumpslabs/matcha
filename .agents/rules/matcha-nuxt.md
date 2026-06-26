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

## Data Fetching
```typescript
// ✅ SSR-safe
const { data } = await useAsyncData('key', () => $fetch('/api/data'));
const { data } = await useFetch('/api/data');
```
- useAsyncData / useFetch over raw fetch
- useLazyAsyncData for non-blocking

## Auto-imports
- Composables + Components auto-imported (tree-shaken)

# 🔎 Reuse check
Check nuxt.config.ts plugins before adding modules
