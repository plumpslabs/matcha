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

## Deliberate Shortcuts
```typescript
// matcha: temp workaround until auth module refactored
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

## Checklist

- [ ] No hardcoded values — all config via env vars (`APPNAME_VAR_NAME`)
- [ ] Error paths explicit — no empty catch blocks
- [ ] One function = one responsibility
- [ ] No unnecessary dependencies — stdlib preferred
- [ ] Deliberate shortcuts documented with `// matcha:`
