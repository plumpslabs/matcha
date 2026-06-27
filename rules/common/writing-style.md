# 🍵 matcha Writing Style

> Simple. Efficient. Deliberate. Never twice.

10 writing rules for commit messages, code comments, documentation, PR descriptions, error messages, and READMEs. Not for prose (docs, papers) — matcha is an engineering convention, not a writing guide.

## RULE-01: Direct Sentences, No Fluff

**Directive:** Do not use "in order to", "due to the fact that", "it is important to note that". Be direct.

```
# ❌ Bad — filler
It is important to note that the API rate limit was increased in order to prevent timeout issues.

# ✅ Good — direct
Increased API rate limit from 100 to 500 req/min to prevent timeout on batch endpoints.
```

**Rationale:** Filler phrases make readers wait for substance that never arrives. Matcha is efficient — language must be efficient too.

---

## RULE-02: Comments = Why, Not What

**Directive:** Code explains the *what*. Comments must explain the *why* — context, decisions, trade-offs. If a comment only repeats the code, remove it.

```
# ❌ Bad — repeating code
// Set the user's name
user.name = name;

# ✅ Good — explaining context
// Skip setting name for OAuth users — profile sync happens via webhook
if (!user.isOAuth) user.name = name;
```

**Rationale:** Comments that repeat the code are noise. Code readers can see `user.name = name`. What they don't know is *why* the condition `!user.isOAuth` exists.

---

## RULE-03: Error Messages Must Be Actionable

**Directive:** Don't just say "Something went wrong". Error messages must tell: (1) what went wrong, (2) where, and (3) how to fix it.

```
# ❌ Bad — uninformative
Error: Something went wrong

# ✅ Good — actionable
Error: Can't connect to database at DB_HOST:5432
  → Check: 1) DB credentials in .env  2) Network access  3) DB service status
```

**Rationale:** Unactionable error messages only cause frustration. Matcha is deliberate — if there is an error, there must be a way out.

---

## RULE-04: Commit Message = `type(scope): subject`

**Directive:** Use the conventional commits format. Subject ≤72 chars, imperative mood. The body explains *why*, not *what*.

```
# ❌ Bad — vague
fixed bug

# ❌ Bad — WIP
wip commit

# ✅ Good — clear
fix(auth): handle expired token during refresh

Token refresh was throwing unhandled 401 when the refresh token itself
was expired. Now returns a clear 400 with "REFRESH_EXPIRED" so the
client can redirect to login.

# ✅ Good — small, single line
chore(deps): upgrade express to v5
```

**Rationale:** Clear commit messages make the git log useful 6 months down the road. Matcha is "never twice" — if a commit message is unclear, someone will have to ask again.

---

## RULE-05: Avoid Abstract Words When Concrete Ones Exist

**Directive:** "improvements", "various issues", "performance optimization" — these say nothing. State specific numbers, names, or causes.

```
# ❌ Bad — abstract
Improved application performance and fixed various issues.

# ✅ Good — concrete
POST /checkout p95 latency decreased from 320ms to 120ms (Redis cache hit rate 94%)
Fixed null pointer in UserService.getProfile() when user is deleted.
```

**Rationale:** Abstract words are an AI-tell. LLMs love to say "improvements across various metrics" when there is no data. Matcha is deliberate — if you claim something, it must be measurable.

---

## RULE-06: Active Voice, Not Passive Voice

**Directive:** "X was done by Y" → "Y did X". Passive voice hides the agent, unless the agent is truly unknown or irrelevant.

```
# ❌ Bad — passive
The database migration was run by the deployment script.

# ✅ Good — active
The deployment script ran the database migration.

# ❌ Bad — passive
Errors are logged to /var/log/app.log when the service crashes.

# ✅ Good — active
The service logs errors to /var/log/app.log on crash.
```

**Rationale:** Passive voice makes sentences longer and less clear. Matcha is simple — active voice is shorter, clearer, and more direct.

---

## RULE-07: PR Description Uses 5W1H

**Directive:** Every PR must answer: What, Why, How, Testing, and Notes. Format:

```
## What
[1 line — what changed]

## Why
[why this is necessary — what was broken or missing]

## How
[how it is implemented — high level]

## Testing
- [ ] Unit tests added/passed
- [ ] Manual test scenario

## Notes
[anything the reviewer should know — trade-offs, follow-up tasks]
```

**Rationale:** 5W1H is in Matcha's DNA. PRs without context confuse reviewers. Clear PRs mean faster reviews and faster merges.

---

## RULE-08: Do Not Use "Leverage", "Cutting-Edge", "Game-Changing"

**Directive:** These words are dead. They are overused to the point of meaninglessness. If there is a new feature, explain what it does, do not just label it.

```
# ❌ Bad — meaningless
Leverage our cutting-edge AI platform to optimize your workflow.

# ✅ Good — clear
Our API returns personalized recommendations based on user behavior history.
```

**Rationale:** These words are heavy AI-tells. LLM models love to say "leverage" and "cutting-edge" because they are prevalent in marketing corpora. Matcha is simple — state it as it is.

---

## RULE-09: Documentation = Single Source of Truth

**Directive:** Do not repeat information that already exists elsewhere. Link it instead. If the information changes, you only need to update it in one place.

```
# ❌ Bad — duplication
For configuration, see the .env file. The .env file has:
DB_HOST=localhost
DB_PORT=5432

# ✅ Good — reference
Configuration: see .env.example in project root.
Full API docs: see docs/api.md

# ❌ Bad — scattered
Timeout settings are in both config.ts and docker-compose.yml

# ✅ Good — single source
Timeout: defined in config.ts (used by both the app and docker-compose)
```

**Rationale:** Never twice — including information. If something changes, you shouldn't have to edit N places. Matcha is efficient — 1 source, 1 edit.

---

## RULE-10: Casual-Direct Tone, Not Stiff-Formal

**Directive:** Write as if you are talking to another senior engineer. No need for "Dear Sir/Madam". No need for "Please find attached". Be direct, clear, and slightly sarcastic if needed.

```
# ❌ Bad — stiff
Please find attached the deployment plan for your kind review.

# ✅ Good — casual
Deployment plan attached. Review when you can — mostly config changes.

# ❌ Bad — too informal
yo dude check out my code lol

# ✅ Good — casual but professional
PR ready: adds Redis caching for GET /products. ~50 lines.
Main concern: TTL strategy — is 5 minutes enough?
```

**Rationale:** Matcha is casual-direct with light sarcasm. Stiff-formal creates distance. Too informal is unprofessional. The target is: "chatting with a senior engineer you respect".

---

## Escape Hatch

> Break any rule above if following it makes your writing less clear.

These are writing guidelines, not laws. If RULE-01 (directness) makes you lose context, use a little filler. If RULE-10 (casualness) is not suitable for a regulatory document, use formal language. Use judgment.

---

## Implementation

This file is auto-loaded as a common rule in all projects using matcha. It applies to:
- Commit messages
- Code comments
- PR descriptions
- Error messages
- README updates
- Documentation changes

It does not apply to (relying on agent judgment):
- External documentation requiring a formal tone
- Regulatory/compliance writing
- User-facing copy that already has its own style guide

## Checklist

- [ ] Commit message: `type(scope): subject` — ≤72 chars, imperative
- [ ] Comments explain *why*, not *what*
- [ ] Error messages actionable — what + where + fix
- [ ] Active voice — subject does the action
- [ ] No filler phrases, no dead buzzwords
- [ ] Single source of truth — link, don't duplicate
