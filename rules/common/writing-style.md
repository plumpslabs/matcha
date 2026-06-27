# 🍵 matcha Writing Style

> Simple. Efficient. Deliberate. Never twice.

10 writing rules for commit messages, code comments, documentation, PR descriptions, error messages, and READMEs. Not for prose (docs, papers) — matcha is an engineering convention, not a writing guide.

## RULE-01: Kalimat Langsung, Gak Pake Basa-Basi

**Directive:** Jangan pake "in order to", "due to the fact that", "it is important to note that". Langsung aja.

```
# ❌ Bad — filler
It is important to note that the API rate limit was increased in order to prevent timeout issues.

# ✅ Good — langsung
Increased API rate limit from 100 to 500 req/min to prevent timeout on batch endpoints.
```

**Alasan:** Filler phrases bikin pembaca nunggu-nunggu substance yang gak dateng. Matcha itu efficient — kalimat juga harus efficient.

---

## RULE-02: Komentar = Kenapa, Bukan Apa

**Directive:** Code udah jelasin *what*. Komentar harus jelasin *why* — konteks, keputusan, trade-off. Kalo komentar cuma ngulangin code, dihapus aja.

```
# ❌ Bad — ngulangin code
// Set the user's name
user.name = name;

# ✅ Good — jelasin konteks
// Skip setting name for OAuth users — profile sync happens via webhook
if (!user.isOAuth) user.name = name;
```

**Alasan:** Komentar yang ngulangin code adalah noise. Pembaca code bisa liat sendiri `user.name = name`. Yang mereka gak tau adalah *kenapa* ada kondisi `!user.isOAuth`.

---

## RULE-03: Error Message Harus Actionable

**Directive:** Jangan cuma "Something went wrong". Error message harus ngasih tau: (1) apa yang salah, (2) di mana, (3) gimana fixnya.

```
# ❌ Bad — gak nullang apa-apa
Error: Something went wrong

# ✅ Good — actionable
Error: Can't connect to database at DB_HOST:5432
  → Check: 1) DB credentials in .env  2) Network access  3) DB service status
```

**Alasan:** Error message yang gak actionable cuma bikin frustrasi. Matcha itu deliberate — kalo error, harus ada jalan keluarnya.

---

## RULE-04: Commit Message = `type(scope): subject`

**Directive:** Pake conventional commits format. Subject ≤72 chars, imperative mood. Body jelasin *why*, bukan *what*.

```
# ❌ Bad — vague
fixed bug

# ❌ Bad — WIP
wip commit

# ✅ Good — jelas
fix(auth): handle expired token during refresh

Token refresh was throwing unhandled 401 when the refresh token itself
was expired. Now returns a clear 400 with "REFRESH_EXPIRED" so the
client can redirect to login.

# ✅ Good — kecil, 1 baris
chore(deps): upgrade express to v5
```

**Alasan:** Commit message yang jelas = git log yang berguna 6 bulan kemudian. Matcha itu "never twice" — kalo commit message gak jelas, orang bakal nanya ulang.

---

## RULE-05: Jangan Pake Kata Abstrak Kalo Ada Yang Konkret

**Directive:** "improvements", "various issues", "performance optimization" — ini gak nullang apa-apa. Sebutin angka, nama, atau penyebab spesifik.

```
# ❌ Bad — abstrak
Improved application performance and fixed various issues.

# ✅ Good — konkret
POST /checkout p95 latency turun 320ms → 120ms (cache Redis hit rate 94%)
Fixed null pointer di UserService.getProfile() ketika user deleted.
```

**Alasan:** Kata abstrak adalah AI-tell. Model LLM suka nullang "improvements across various metrics" padahal gak ada data. Matcha itu deliberate — kalo nullang sesuatu, harus bisa diukur.

---

## RULE-06: Aktif Voice, Jangan Pasif

**Directive:** "X was done by Y" → "Y did X". Pasif disembunyikan agent-nya. Kecuali kalo agent-nya beneran gak dikenal atau gak relevan.

```
# ❌ Bad — pasif
The database migration was run by the deployment script.

# ✅ Good — aktif
The deployment script ran the database migration.

# ❌ Bad — pasif
Errors are logged to /var/log/app.log when the service crashes.

# ✅ Good — aktif
The service logs errors to /var/log/app.log on crash.
```

**Alasan:** Pasif bikin kalimat lebih panjang dan kurang jelas. Matcha itu simple — active voice lebih pendek, lebih jelas, lebih langsung.

---

## RULE-07: PR Description Pake 5W1H

**Directive:** Setiap PR harus jawab: What, Why, How, Testing, Notes. Format:

```
## What
[1 line — apa yang berubah]

## Why
[kenapa ini perlu — apa yang broken atau missing]

## How
[gimana implementasinya — high level]

## Testing
- [ ] Unit tests added/passed
- [ ] Manual test scenario

## Notes
[anything reviewer should know — trade-offs, follow-up tasks]
```

**Alasan:** 5W1H adalah DNA matcha. PR tanpa konteks bikin reviewer bingung. PR yang jelas = review lebih cepet = merge lebih cepet.

---

## RULE-08: Jangan Pake "Leverage", "Cutting-Edge", "Game-Changing"

**Directive:** Kata-kata ini udah mati. Dipake sama太多 orang sampai gak berarti lagi. Kalo ada fitur baru, jelasin apa yang dilakukan, bukan sebutin labelnya.

```
# ❌ Bad — meaningless
Leverage our cutting-edge AI platform to optimize your workflow.

# ✅ Good — jelas
Our API returns personalized recommendations based on user behavior history.
```

**Alasan:** Kata-kata ini adalah AI-tell kelas berat. Model LLM suka nullang "leverage" dan "cutting-edge" karena banyak di corpus marketing. Matcha itu simple — nullang apa adanya.

---

## RULE-09: Dokumentasi = Single Source of Truth

**Directive:** Jangan nullang ulang informasi yang udah ada di tempat lain. Link aja. Kalo informasi berubah, cuma perlu update 1 tempat.

```
# ❌ Bad — duplikasi
For configuration, see the .env file. The .env file has:
DB_HOST=localhost
DB_PORT=5432

# ✅ Good — reference
Configuration: see .env.example in project root.
Full API docs: see docs/api.md

# ❌ Bad — nyebar
Timeout settings are in both config.ts and docker-compose.yml

# ✅ Good — 1 source
Timeout: defined in config.ts (used by both app and docker-compose)
```

**Alasan:** Never twice — termasuk informasi. Kalo ada yang berubah, lo harus edit N tempat. Matcha itu efficient — 1 sumber, 1 edit.

---

## RULE-10: Tone Casual-Direct, Bukan Formal Kaku

**Directive:** Nullang kaya lo lagi ngomong sama senior engineer lain. Gak perlu "Dear Sir/Madam". Gak perlu "Please find attached". Langsung, jelas, sarkas dikit kalo perlu.

```
# ❌ Bad — kaku
Please find attached the deployment plan for your kind review.

# ✅ Good — casual
Deployment plan attached. Review when you can — mostly config changes.

# ❌ Bad — terlalu informal
yo dude check out my code lol

# ✅ Good — casual tapi profesional
PR ready: adds Redis caching untuk GET /products. ~50 lines.
Main concern: TTL strategy — 5 menit cukup?
```

**Alasan:** Matcha itu casual direct dengan sarkas ringan. Formal kaku bikin jarak. Terlalu informal gak profesional. Target: "ngobrol sama senior engineer yang lo hormati".

---

## Escape Hatch

> Langgar aturan di atas kalo ngikutin aturan bikin tulisan lo makin gak jelas.

Ini writing guidelines, bukan hukum. Kalo RULE-01 (langsung) bikin konteks hilang, pake filler dikit gapapa. Kalo RULE-10 (casual) gak cocok buat regulatory document, pake formal. Pake judgment.

---

## Implementasi

File ini auto-loaded sebagai common rule di semua project yang pake matcha. Berlaku untuk:
- Commit messages
- Code comments
- PR descriptions
- Error messages
- README updates
- Documentation changes

Tidak berlaku untuk (masih pake judgment agent):
- External documentation yang butuh tone formal
- Regulatory/compliance writing
- User-facing copy yang udah punya style guide sendiri

## Checklist

- [ ] Commit message: `type(scope): subject` — ≤72 chars, imperative
- [ ] Comments explain *why*, not *what*
- [ ] Error messages actionable — what + where + fix
- [ ] Active voice — subject does the action
- [ ] No filler phrases, no dead buzzwords
- [ ] Single source of truth — link, don't duplicate
