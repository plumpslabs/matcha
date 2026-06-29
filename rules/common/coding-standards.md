# Common Coding Standards
## No Hardcoded Values
Use env vars: `APPNAME_VAR_NAME`
```env
# ❌ Bad
const API_URL = "https://api.example.com";

# ✅ Good
const API_URL = process.env.MATCHA_API_URL;
```

## Error Handling
```typescript
// ❌ Bad — swallowed
try { await risky(); } catch {}

// ✅ Good — explicit
try { await risky(); } catch (e) {
  logger.error("risky failed", e);
  throw; // or handle
}
```

## One Function, One Thing
```typescript
// ❌ Bad
function handleUser(data) {
  validate(data);
  save(data);
  sendEmail(data);
  log(data);
}

// ✅ Good
async function createUser(data) {
  await validate(data);
  return save(data);
}
```

## Prefer Stdlib
Before adding a dependency: can stdlib do it? 3 use cases → abstract.


## Type Safety
```typescript
// ❌ Bad — type escape hatch
const data: any = fetchData();
// ✅ Good — typed
const data: unknown = fetchData();
```

Prefer the type system over runtime escape hatches. Each language has its own escape hatch — avoid them:
- TypeScript: `any` → use `unknown` + narrow, or generics
- Go: `interface{}` → use concrete types or generics
- Python: `Any` → use `Unknown` or `TypeVar`
- Java: raw types → always parameterize generics
- PHP: `mixed` → use union types

## Observability
```typescript
// ❌ Bad — silent or plain console.log
console.log("user created");

// ✅ Good — structured with level + context
logger.info("user created", { userId: user.id, role: user.role });
logger.error("payment failed", { orderId, error: e.message });
```
Use structured logging: log level (info/warn/error), context-rich messages.
Never commit `console.log` without a proper logger.

## Pure Functions
```typescript
// ❌ Bad — mixed logic + side effect
function processOrder(order: Order) {
  const total = order.items.reduce((sum, i) => sum + i.price, 0);  // pure logic
  db.save(order);  // side effect mixed in
  return total;
}

// ✅ Good — separated
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, i) => sum + i.price, 0);  // pure
}
async function processOrder(order: Order) {
  const total = calculateTotal(order.items);  // pure
  await db.save({ ...order, total });  // side effect at boundary
  return total;
}
```
Prefer pure functions for logic. Isolate side effects (I/O, DB, API, mutations) at boundaries.

## Config Validation
```typescript
// ❌ Bad — undefined env var discovered deep in logic
const apiUrl = process.env.API_URL;  // undefined → cryptic error at runtime

// ✅ Good — validate at startup, fail fast
const REQUIRED_ENV = ["API_URL", "DB_URL", "JWT_SECRET"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}
```
Validate required config at startup. Fail fast with descriptive error.
## No Premature Optimization
Write clean, readable code first. Optimize only when:
1. You have **measured** a bottleneck (profiler, not gut feel)
2. The bottleneck is in a **hot path** (frequent execution)
3. The optimization **doesn't sacrifice readability** for marginal gains

```typescript
// ❌ Bad — cryptic micro-optimization before knowing if it matters
const s = a ?? ''; const r = s ? s.split('').reverse().join('') : '';

// ✅ Good — readable first, profile later
function reverse(str: string | null): string {
  if (!str) return '';
  return str.split('').reverse().join('');
}
```

Premature optimization = trading readability for performance you don't need yet.

## Validate at Boundaries
```typescript
// ❌ Bad — deep validation after partial write
export async function createUser(data: unknown) {
  const user = await db.save(data);  // written to DB first
  if (!user.email) throw new Error("email required");  // validation too late
}

// ✅ Good — validate at the boundary before any mutation
export async function createUser(data: CreateUserInput) {
  const valid = UserSchema.parse(data);  // validate at API boundary
  return db.save(valid);
}
```
Validate input at layer boundaries (controller/API/DTO). Partial failure after partial write is worse than early rejection.

## Command-Query Separation (CQS)
```typescript
// ❌ Bad — mixed command + query
function saveAndReturn(user: User): User {
  db.save(user);
  notification.send(user);
  return calculateProfile(user);  // side effect + return = confusing
}

// ✅ Good — separated
function save(user: User): void {  // command: void return
  db.save(user);
  notification.send(user);
}
function getProfile(user: User): Profile {  // query: pure-ish return
  return calculateProfile(user);
}
```
A method either returns data (query) or changes state (command). Never both.

## Idempotency
```typescript
// ❌ Bad — no idempotency, double charge risk
app.post("/payment", async (req, res) => {
  await chargeUser(req.user, req.body.amount);  // 2x = charged twice
});

// ✅ Good — idempotency key
app.post("/payment", async (req, res) => {
  const key = req.headers["idempotency-key"];
  if (await hasProcessed(key)) return res.json(await getResult(key));
  const result = await chargeUser(req.user, req.body.amount);
  await markProcessed(key, result);
  res.json(result);
});
```
Operations should be safe to retry. Same request sent twice = same result. Use idempotency keys for payments, webhooks, and retry logic.

## Deliberate Shortcuts
```typescript
// matcha: temp workaround until auth module refactored
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

## Checklist

- [ ] **Type-safe by default** — no escape hatches (`any`, `interface{}`, `Any`, `mixed`, raw types)
- [ ] No hardcoded values — all config via env vars (`APPNAME_VAR_NAME`)
- [ ] Error paths explicit — no empty catch blocks
- [ ] One function = one responsibility
- [ ] No unnecessary dependencies — stdlib preferred
- [ ] Observability — structured logging, no plain console.log committed
- [ ] Validate at boundaries — input validated at outer layers before mutation
- [ ] CQS — commands return void, queries return data, never mixed
- [ ] Idempotency — retry-safe with idempotency keys for mutations
- [ ] Contract-first — draft response/props shape before implementation
- [ ] Error shape consistent — same format across all endpoints
- [ ] State origin clear — is this server, client, or shared state?
- [ ] Pure functions — side effects isolated at boundaries
- [ ] Config validated at startup — fail fast if required env vars missing
- [ ] No premature optimization — readable first, profile before optimizing
- [ ] Deliberate shortcuts documented with `// matcha:`
