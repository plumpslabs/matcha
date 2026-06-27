# Git Workflow

## Branch Strategy
- **Trunk-based development**: short-lived feature branches → main
- Branch naming: `feat/short-description`, `fix/issue-description`, `chore/cleanup`
- No long-running branches — rebase daily to main

## Commit Messages
```
# Conventional Commits
<type>(<scope>): <subject>

# Subject: ≤72 chars, imperative mood, lowercase
# Body: explain WHY, not what (optional)

feat(auth): add OAuth2 Google login
fix(api): handle null response from user service
refactor(db): extract query builder from UserRepository
docs(api): update endpoint documentation
test(auth): add unit tests for token validation
chore(deps): upgrade express to v5
```
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`
- **One commit = one logical change** — no "WIP" or "fix fix fix"
- Squash messy history before pushing to main

## Pull Requests
- Title follows conventional commit format
- Description: what + why + how to test
- Link to issue/ticket
- Self-review before requesting review

## Rebase over Merge
```bash
git checkout feat/my-feature
git rebase main
# Resolve conflicts, then force push (if solo branch)
git push --force-with-lease
```
- Rebase to keep linear history
- Merge commits only on main (`git merge --no-ff`)
- Never rebase shared branches

## Pre-Commit Checklist
- [ ] Test suite passes (`npm test`, `go test ./...`, etc.)
- [ ] No debug code (`console.log`, `print()`, `debugger`)
- [ ] No commented-out code
- [ ] Matcha review passed
- [ ] Conventional commit format

## Checklist

- [ ] Branch is short-lived — rebased to main daily
- [ ] Commit message follows `type(scope): subject` format
- [ ] One commit = one logical change
- [ ] PR description includes What + Why + How to test
- [ ] No WIP or "fix fix fix" commits in history