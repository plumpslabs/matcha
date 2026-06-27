---
description: Matcha Redis caching and data patterns
globs: ["**/*.{ts,js,py,go,java,php}"]
alwaysApply: false
---

# Redis Standards

## Key Naming
`app:entity:id:field` — colons for hierarchy, TTL on every key
Consistent prefix per domain, max key length 1024 bytes

## Data Type Selection
- String → cache, counters, sessions
- Hash → objects (partial updates with HSET)
- List → queues (LPUSH + BRPOP)
- SortedSet → leaderboards, rate limiting
- Stream → event logs (over Pub/Sub for reliability)

## Caching Pattern (Cache-Aside)
```typescript
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
const data = await db.find(...);
await redis.setex(key, 300, JSON.stringify(data));
return data;
```
- TTL based on data staleness
- Write-through for critical data
- Avoid cache stampede: SET NX or locks

## Checklist
- [ ] Key namespaced with `app:entity:id:field` convention
- [ ] TTL set on every key — no memory leaks
- [ ] `SCAN` over `KEYS` in production
- [ ] Right data type chosen (Hash vs String vs SortedSet)
- [ ] Cache stampede protection (`SET NX` / locks)
- [ ] Check existing cache layer before adding new redis calls
