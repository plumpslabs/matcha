# 🍵 matcha Benchmark Report

> Focus: **Quality-first.** Real-world feature implementation measured on the *value* the rules produce — correctness, code quality (defect density), and safe complex-task execution — with cost (tokens, time) reported as *context*, not as the verdict.
> Generated: 2026-08-08 · runner: `benchmark/live-bench.js` (v3: quality-first + complex tasks + standing-context A/B)

---

## Live Benchmark — Post-Fix Run (Agentic, Real Repo)

**Setup**: `express-api` fixture · 3 features × 3 arms × 2 iterations = **18 cells** · `opencode run --format json` (deepseek-v4-flash-free) · median reported

| Metric (median) | ❌ No rules | 💬 Terse prompt | 🍵 matcha rules |
|--------|:-----------:|:---------------:|:---------------:|
| **Correctness** (fail→pass) | 1.0 | 1.0 | 1.0 |
| **ExpectedPass** (target suite green) | 5/6 | 5/6 | 5/6 |
| **LOC added** | 13.5 | 6.5 | 17 |
| **Tokens total** | 395K | 347K | 643K |
| **LLM steps** | 8.5 | 7.5 | 12.5 |
| **Wall time** | 58s | 34s | 78s |
| **Compliance score** (changed files) | 100 | 100 | 100 |

### Before/after — did the fix move the needle?

| Matcha overhead vs baseline (same-run delta) | Run 1 (pre-fix) | Run 2 (post-fix) | Verdict |
|---|---|---:|---|
| **LOC overhead** | +136% | **+26%** | ✅ Down — anti-overbuild guidance + small-plan variant work |
| **Wall-time overhead** | +70% | **+34%** | ✅ Down — size-gate skips the plan ceremony on small edits |
| **Token overhead** | +33% | +63% | ⚠️ Up — within run-to-run variance; needs n≥5 to conclude |
| **Steps overhead** | +22% | +47% | ⚠️ Up — same caveat |
| **Correctness** | tie | tie | Stable — matcha never hurt correctness |

> **Honest reading:** LOC and time overhead dropped measurably after the proportionality fixes — the direction is right. Token/steps moved *against* us this run, but n=2 per cell and heavy LLM variance (±237K tokens stdev in run 1) mean that is not a statistically meaningful regression. **n≥5 is the honest next step** before claiming victory on cost.

### Honest findings (no marketing)

1. **Correctness is identical across arms — again.** Both runs, all arms: 1.0 fail→pass and 5/6 expectedPass. On these 3 small features matcha neither helps nor hurts.
2. **Matcha still writes more code** (17 vs 13.5/6.5) but the gap narrowed sharply after the anti-overbuild fix (+136% → +26% overhead vs baseline).
3. **The process overhead is real and directional:** ~+34% time in the post-fix run. Better than +70%, still not free.
4. **`expectedPass` is the sharper metric** — it measures whether the *target feature's* tests pass, instead of being diluted by unrelated failing suites in the fixture. All arms tie at 5/6.

### What this means (quality-first reading)

- **Cost is context, not verdict.** Matcha spends more tokens/time because it *thinks before it implements* — that investment buys precision, structure, and prevention. A benchmark that reports only cost measures the wrong side of the ledger. The quality side (defect density, correctness, safe complex refactors) is the reason the cost is worth paying.
- **Small/trivial tasks: matcha is overkill — by design.** Proportionality already routes them through the ≤30-line fast path, the `<!-- trivial -->` plan, and L1-only review. **Use `/matcha:intensity observe`** for trivia — that's the intended operating mode, not a failure of the rules.
- **The gate's value is prevention, not speed.** 0 destructive-command incidents across all agentic runs.

---

## Complex-Task Benchmarks (v3 — where matcha should win)

The 3 small tasks above are deliberately simple — they are the *baseline hygiene* check. The complex tasks are where a thinking-first agent earns its cost:

| Task | Shape | What it measures |
|------|-------|------------------|
| `refactor-users-service` | Multi-file refactor: extract store + lookup out of the route into `src/services/userService.js` | **Safe refactoring** — does the agent restructure without breaking behavior? (all existing tests green + no duplicated logic) |
| `fix-auth-security` | Multi-layer bug: auth bypass (`Authorization: "null"`/`"undefined"` pass) + non-numeric `:id` returns 404 instead of 400 | **Root-cause + security discipline** — does it find both layers of the bug and fix them without breaking valid auth? |

**Quality metric — defect density (anti-pattern findings per 100 LOC added):** the runner scans only the files the agent wrote/changed and counts real anti-patterns (empty catches, magic numbers, hardcoded secrets, dead code) via `hooks/patterns.json`. This is the apples-to-apples quality number — baseline agents write few, sloppy lines; matcha writes more, cleaner lines. **Lower is better, and it is the value side of the cost ledger.**

### First complex-task run (2026-08-08) — free model, n=1–2/cell

| Task | ❌ No rules | 💬 Terse | 🍵 Matcha |
|------|:---:|:---:|:---:|
| `refactor-users-service` — completed | 0/2 (adds 3 LOC, refactor not done) | 0/2 (adds 3 LOC, refactor not done) | **1/1** (+15 LOC, service layer extracted, tests green) |
| `refactor-users-service` — defect density | n/a (no-op) | n/a (no-op) | 6.7 (1 finding / 15 LOC) |
| `fix-auth-security` — passed | 1/1 (+8 LOC) | 2/2 (+4 LOC) | 1/1 (+16 LOC, density 0) |

**Honest reading:** without rules the agent *fails the multi-file refactor* — it adds a few lines and stops; matcha is the only arm that extracts the service layer without breaking behavior. On the small security bug every arm that finished fixed it — no measurable edge for matcha there (its cells repeatedly hit free-model queue timeouts >540s; an environment artifact — the same task passed at 240s in the dry-run). Defect density is only meaningful for *completed* work: baseline/terse wrote 3 no-op lines, so their `n/a` is not a clean bill of health.

**The rework counterfactual (assumption, not measured):** the token tables compare *upfront* cost only. Unfinished output isn't cheaper — it's a redo ticket. Baseline/terse produced +3 LOC no-ops on the refactor; redoing that task (reopen, re-understand, re-implement, re-test) plausibly costs ~1.5× the original run — ≈590K tokens on the small-task numbers (baseline 395K), larger than matcha's whole +248K premium (643K vs 395K). One redo and no-matcha has already spent more (≈985K vs 643K), plus developer hours tokens don't capture; two redos = more spend *and* shipped debt. Matcha's premium is paid once up front; the no-matcha cost is paid later, repeatedly, with interest.

---

## Standing-Context A/B — core-only vs full matcha (2026-08-08)

**Question:** does slimming the skill modules + enforcing lazy-load actually cut token cost? The full skill is ~10.7K tokens standing (AGENTS.md + SKILL.md + 5 modules); a core-only injection is ~5.4K. We ran a dedicated A/B to measure it.

**Setup**: 2 features × 2 arms × 5 iterations = **20 cells** · arms: `matcha` (full rules) vs `matcha-lite` (skill stripped to `core.md` only via `injectOpenCodeRulesLite`) · same model, same fixture, same prompts.

| Task | Arm | Tokens (median) | cacheRead (median) | Steps (median) |
|---|---|---:|---:|---:|
| rate-limiting | matcha full | 746K | 690K | 14 |
| rate-limiting | **matcha-lite** | **642K (−14%)** | **585K** | 12 |
| pagination | matcha full | 552K | 501K | 11 |
| pagination | matcha-lite | 715K (+29%) | 662K | 14 |
| **Combined (10 cells/arm)** | matcha full | 725K | — | — |
| **Combined** | matcha-lite | 679K (**−6.3%**) | — | — |

**Honest reading — the fix is right but the metric is not conclusive:**

1. **Slim + lazy-load is directionally correct.** `core.md` went 18.6K → 15.9K chars (~4.5K → ~4.0K tokens) with zero content loss (all 6 checkpoints, session memory, review gate intact); `SKILL.md` now instructs lazy-load explicitly. That *is* the right architecture.
2. **But at n=10 per arm the token delta (−6.3% median) is smaller than the noise.** Stdev is ±150K tokens; the two tasks disagree (rate-limiting −14%, pagination +29%). Per-step cacheRead is ~48-49K on BOTH arms — meaning the standing context the model re-reads each step is dominated by **AGENTS.md + agents/ + hooks/ + opencode's own system prompt**, not the skill modules. Slimming modules shaved ~1.5K of ~49K per step — real but ~3%.
3. **Target for real token reduction is elsewhere:** the injected surface (AGENTS.md, agent files, hook instructions) dwarfs the skill. That's a separate optimization (leaner AGENTS.md/agents) — the module slim is a necessary but insufficient step.

**What this proves:** the lazy-load/slim change is correct-by-architecture and removes a real per-turn cost (~1.5K tokens), but claims of large token savings would be over-selling it. The measurement harness (`--arm matcha-lite`) is now in place so this A/B can be re-run after any future standing-context change.

---

## Prior: Multi-Turn Feature Benchmark (June 2026)

**Setup**: Express API · 3 features × 3 steps · agy (Gemini 3.5 Flash) · full matcha injection

| Feature | LOC | Tests | Passed |
|---------|:---:|:-----:|:------:|
| Activity Tracking | 111 | 12 | ✅ 12 |
| Pagination | 67 | 10 | ✅ 10 |
| Rate Limiting | 75 | 8 | ✅ 8 |
| **Total** | **270** | **30** | **✅ 30/30** |

All 3 features scored **A** for matcha compliance: named constants, separate validation functions, explicit errors, env configuration, no debug leftovers, no regressions.

---

## Prior: Simple Prompt Test — Matcha vs No Matcha

**Setup**: Same project, same prompt `"Add an activity endpoint"` (vague) · agy (Gemini 3.5 Flash)

| Criterion | 🍵 WITH Matcha | ❌ WITHOUT Matcha |
|-----------|:--------------:|:-----------------:|
| Tests Passed | 12/12 | 12/12 |
| LOC | 80 | 69 |
| Status Codes | `STATUS_CREATED`, `STATUS_BAD_REQUEST` | Hardcoded `404`, `400`, `201` |
| Error Message | `"Action must be a non-empty string"` | `"Invalid input"` (generic) |
| Validation | Separate `validateActivityInput()` | Separate function |
| Data Structure | Per-user `activitiesStore = {}` | Flat `activities = []` array |

> **Key insight:** matcha's value is most visible when the prompt is vague — named constants, explicit errors, and better data structures at ~16% more LOC.

---

## Methodology (current runner)

- **Runner**: `benchmark/live-bench.js` — spawns `opencode run --format json --dir <fixture>` headless, parses real `step_finish` token/cost events.
- **Arms**: baseline (no rules) / terse (`"Be brief. Minimal code."`) / matcha (full `.opencode/` + `.agents/` + `hooks/` + `AGENTS.md` injected, opencode format).
- **Fixture hygiene** (all required for validity):
  - Fresh `mkdtemp` **outside the matcha repo** (opencode ignores Node's spawn `cwd` and walks up to the parent repo's config — a fixture under `benchmark/` inherits matcha's own planning gate and silently blocks every edit, invalidating the arm).
  - `.gitignore` for `node_modules/` + lockfile so the initial commit is fast and agent diff is clean.
  - Baseline test measured **after** `npm install` (a before-count without deps is garbage).
  - Deps installed from a shared `/tmp` cache (one `npm install`, reused).
- **Metrics**: fail→pass (tests failing before agent that pass after), LOC via `git diff --numstat`, tokens/steps/cost from real provider events, wall time, compliance of changed files only.
- **Limits**: n=2 per cell (median, not statistically conclusive), one free model, small fixtures. Running `node benchmark/live-bench.js --all --n 5` on a larger repo is the validation path.

---

*Report generated by real headless agent execution — process metrics (tokens/time) are measured, not estimated.*
