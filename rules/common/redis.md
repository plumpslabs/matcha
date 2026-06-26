# Redis Best Practices

## Key Naming
```
// Namespace: app:entity:id:field
user:1001:name
session:abc123:data
cache:products:featured
rate-limit:api:user:1001
```
- Colons for hierarchy
- Consistent prefix per domain
- TTL on every key (avoid memory leaks)
- Max key length: 1024 bytes

## Data Types
```typescript
// ✅ Choose the right type
String    → cache, counters, sessions
Hash      → objects (user profile)
List      → queues, timelines
Set       → tags, unique visitors
SortedSet → leaderboards, rate limiting
Stream    → event logs, message queues
```
- Strings for simple cache (JSON.stringify)
- Hashes for partial updates (HGETALL, HSET)
- Streams over Pub/Sub for reliable messaging
- Avoid KEYS in production — use SCAN

## Caching Pattern
```typescript
async function getProduct(id: string) {
  const cacheKey = `product:${id}`;
  // 1. Try cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  // 2. Miss → fetch + set
  const product = await db.product.findUnique({ where: { id } });
  if (product) await redis.setex(cacheKey, 300, JSON.stringify(product));
  return product;
}
```
- Cache-aside (lazy loading)
- TTL based on data staleness tolerance
- Write-through for critical data
- Avoid cache stampede: use locks or `SET NX`

## Common Patterns
- Rate limiting: `INCR + EXPIRE` (sliding window)
- Distributed locks: `SET key uuid NX EX 10`
- Session store: `SETEX session:token 3600 userData`
- Message queue: `LPUSH` + `BRPOP` (worker pattern)
