---
paths:
- "**/*.vue"
- "**/*.ts"
---

# Nuxt Best Practices

> This file extends [common/coding-standards.md](../common/coding-standards.md) with Nuxt-specific rules.

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

## Server Routes (Nitro)
```typescript
// server/api/users.ts — auto-registered as /api/users
export default defineEventHandler(async (event) => {
  const users = await db.user.findMany();
  return { data: users };
});

// Server-only code, never bundles to client
// Use server/utils/ for shared server logic
```

## Layers
```
my-app/
├── layers/
│   ├── base/          ← shared theme, components
│   └── admin/         ← admin panel features
├── nuxt.config.ts     ← extend layers
└── app.vue
```
- Layers allow code sharing across Nuxt apps
- `nuxt.config.ts`: `extends: ['./layers/base']`
- Each layer has its own components, composables, pages

## SEO
- `useSeoMeta` for per-page SEO (OG tags, title, description)
- `useHead` for `<head>` management
- `nuxt-schema-org` for structured data
- `@nuxtjs/sitemap` for sitemap generation

## Rendering Modes
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/':              { prerender: true },        // static
    '/dashboard/**':  { ssr: false },             // SPA
    '/blog/**':       { swr: 3600 },              // static + revalidate
    '/api/**':        { cors: true },             // API routes
  },
});
```
- `prerender`: static generation (fastest)
- `ssr: false`: client-side only (dashboard)
- `swr`: stale-while-revalidate (blog/content)
- `isr`: incremental static regeneration

## Performance
- `NuxtImage` / `NuxtImg` for optimized images (requires `@nuxt/image`)
- Route transitions with `<NuxtPage transition="..." />`
- `keepalive: true` for cached pages
- Lazy hydrate components with `lazy` prefix: `<LazyFooter />`
- `definePageMeta({ keepalive: true })` for page-level caching

## Checklist

- [ ] `useAsyncData` / `useFetch` over raw `fetch` (SSR hydration)
- [ ] Auto-imported composables in `composables/` directory
- [ ] Server routes in `server/api/` — server-only code
- [ ] Route rules configured in `nuxt.config.ts` (SSR, SPA, prerender)
- [ ] SEO via `useSeoMeta` per page
- [ ] Images optimized with `NuxtImg`
- [ ] Lazy hydrate components with `lazy` prefix where appropriate