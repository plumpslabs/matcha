---
description: Matcha Redis caching and data patterns
globs: ["**/*.{ts,js,py,go,java,php}"]
alwaysApply: false
---

# Redis Standards

## Key Naming
`app:entity:id:field` — colons for hierarchy
TTL on every key, consistent prefix per domain

## Data Type Selection
- String → cache, counters
- Hash → objects with partial updates
- List → queues (LPUSH + BRPOP)
- SortedSet → leaderboards, rate limiting
- Stream → event logs (over Pub/Sub)

## Caching Pattern
```typescript
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
const data = await db.find(...);
await redis.setex(key, 300, JSON.stringify(data));
return data;
```
- Cache-aside with TTL
- Write-through for critical data
- Avoid stampede: SET NX

# 🔎 Reuse check
Check existing cache layer before adding new redis calls
