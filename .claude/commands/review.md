# /matcha:review

Review the current implementation for efficiency, redundancy, and cleanup.

## Instructions for agent

Run the mandatory post-implementation review from the matcha ruleset:

1. **Redundancy check**
   - Is any logic duplicated elsewhere in the codebase?
   - Does any new service/dependency overlap with an existing one?

2. **Simplicity check**
   - Can any code be removed without losing functionality?
   - Would a different data structure simplify this significantly?
   - Is any abstraction unjustified (no second use case)?

3. **Cleanup check**
   - Are there temp files, debug logs, or test artifacts left behind?
   - Unused imports, variables, or dependencies?
   - Commented-out code that was only for testing?

4. **Best practice check**
   - Env vars following `APPNAME_VAR_NAME` pattern?
   - No hardcoded values?
   - Every function single-responsibility?

Report findings using the matcha format:
```
🍵 matcha: review complete

[PASS ✓ or ISSUE ⚠️ for each check]

If issues found:
Options:
  A) ...
  B) ...
Recommendation: ...
```