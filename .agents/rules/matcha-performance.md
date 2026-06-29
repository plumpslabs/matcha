---
description: "🍵 matcha performance — DB, API, caching, frontend perf guidelines"
alwaysApply: false
---

# ⚡ matcha Performance

## Database
- N+1 queries = #1 perf killer — eager load, batch
- O(n²+) loops = #2 perf killer — watch for nested iterations in hot paths
- Paginate ALL list endpoints (cursor > offset)
- Index columns in WHERE, JOIN, ORDER BY
- Connection pool with sane limits

## API & Network
- Compress text responses (gzip/brotli)
- Cache headers (ETag, Cache-Control)
- Debounce search (300ms), throttle scroll
- Timeouts on all external calls

## Caching
- Hot + small → in-memory (LRU)
- Warm + large → Redis
- TTL on every cached item
- Stampede protection (SET NX / locks)

## Frontend
- Virtualized lists for long content
- Lazy load below-fold images + components
- Code split by route, not by library
- Bundle analysis for significant additions

## Checklist
- [ ] No N+1 queries in hot paths
- [ ] No O(n²+) loops in hot paths
- [ ] List endpoints paginated
- [ ] External calls have timeouts
- [ ] Static assets compressed + cached
- [ ] Bundle size reviewed for additions
