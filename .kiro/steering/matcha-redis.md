---
description: Matcha Redis caching and data patterns
inclusion: fileMatch
fileMatchPattern: "*"
---

# Redis Standards

## Key Naming
app:entity:id:field — colons for hierarchy, TTL on every key

## Data Type Selection
- String → cache/counters, Hash → objects
- List → queues, SortedSet → rate limiting
- Stream → event logs (over Pub/Sub)

## Caching Pattern
Cache-aside with TTL, write-through for critical data
Avoid stampede: SET NX or distributed locks

## Checklist
- [ ] Key: `app:entity:id:field` convention
- [ ] TTL on every key
- [ ] `SCAN` over `KEYS` in production
- [ ] Right data type chosen
- [ ] Stampede protection considered
- [ ] Check existing cache layer before adding new redis calls
