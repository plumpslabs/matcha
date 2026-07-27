# /matcha:review

Post-implementation review: redundancy, simplicity, cleanup, best practices.

## Checks
1. **Redundancy** — duplicated logic? service overlap?
2. **Simplicity** — can code be removed? abstraction justified?
3. **Cleanup** — temp files, debug logs, unused imports?
4. **Best practice** — `APPNAME_VAR_NAME`? no hardcoded values?

## Report Format
```
🍵 matcha: review complete
[PASS ✓ or ISSUE ⚠️ for each check]
If issues: Options A/B → Recommendation
```

See `skills/matcha/SKILL.md` for full checkpoint details.
