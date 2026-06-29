# Performance Guidelines

> Performance awareness without premature optimization.

## Principles

1. **Measure before optimizing** — never guess about bottlenecks
2. **N+1 queries are the #1 perf killer** — identify and batch
3. **Cache at the right layer** — in-memory > Redis > DB query cache
4. **Profile in production-like environment** — dev perf != prod perf
5. **Watch for O(n²+) complexity and unnecessary allocations** — nested loops in hot paths are the #2 perf killer after N+1

## Database

- Index columns used in WHERE, JOIN, ORDER BY, GROUP BY
- Eager load relationships, never lazy-load in loops
- Paginate ALL list endpoints (cursor > offset for large datasets)
- Use EXPLAIN ANALYZE on slow queries (>100ms)
- Connection pool with sane limits (not unlimited, not 1)

## API & Network

- Response compression (gzip/brotli) for text responses
- Batch related API calls instead of N sequential requests
- Client-side caching headers (ETag, Last-Modified, Cache-Control)
- Debounce search/autocomplete (300ms), throttle scroll handlers
- Avoid large payloads — paginate, filter fields, use streams

## Frontend

- Virtualized lists for long scrollable content (react-window, FlashList)
- Lazy load below-fold images and components
- Code splitting by route, not by library
- Bundle analysis — know what you ship (`@next/bundle-analyzer`, `source-map-explorer`)
- Memoize expensive computations, not cheap ones

## Background & Async

- Queue heavy/offline work (Bull, Sidekiq, Celery)
- Use streaming for large payloads (not loading into memory)
- Set sane timeouts on all external calls (connect + read)
- Circuit breakers for external service calls

## Caching Strategy

```
Hot data (frequent, small)   → in-memory (Map, LRU cache)
Warm data (frequent, large)  → Redis / Memcached
Cold data (infrequent)       → DB query cache / no cache
```

- Set TTL on every cached item — avoid memory leaks
- Cache-aside pattern: check cache → miss → fetch → set TTL
- Stampede protection: lock on cache miss, or probabilistic early expiry

## Checklist

- [ ] No N+1 queries in hot paths
- [ ] Unbounded queries always have LIMIT — no SELECT without limit
- [ ] New query columns checked for index coverage
- [ ] No O(n²+) loops in hot paths — watch for nested iterations
- [ ] List endpoints paginated
- [ ] DB queries have appropriate indexes
- [ ] External calls have timeouts
- [ ] Static assets compressed + cached
- [ ] Bundle size reviewed for significant additions
