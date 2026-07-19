---
name: i18n-english-flip-plan
description: Locked decisions + refined architecture for the i18n/react-i18next + English-rename + EN question bank work (reviewed 2026-07-17)
metadata:
  type: project
---

Decisions for the i18n / English-flip feature (plan reviewed 2026-07-17; verify against code before relying — implementation may have landed since):

**User-locked (do not relitigate):** react-i18next; French default locale; manual FR/EN toggle persisted to localStorage (`quiz-biblique.lang`); 3 phases (A rename, B i18n chrome+toggle, C locale-aware bank); EN bank is a NEW file `data/quiz_biblique.en.json`, one-time user-authorized machine translation, user-reviewed; `data/quiz_biblique.json` stays strictly off-limits.

**Architecture decisions from my review:**
- Normalize French JSON keys → English internal shape (`{ id, book, text, options, correctAnswers, correctCount, reference, difficulty }`) at the single data seam `src/data/questions.js`; DEV validation runs post-normalization so one validator covers both banks.
- History storage: bump to `quiz-biblique.attempts.v2` with `book` field; lazy idempotent v1→v2 migration inside `readAll` (migrate only when v2 key absent; keep v1 in place; all try/catch). Storage key prefix `quiz-biblique` is product branding — never rename it.
- i18next init is module-scope in `src/i18n/index.js`, synchronous (bundled `resources`, no backend plugin), `useSuspense: false` explicitly, `lng` from try/catch localStorage read. StrictMode is safe because init is module eval, not an effect.
- **HOME-only toggle is a load-bearing invariant**, not styling: it guarantees language cannot change between `pickQuestions` and Results `onReplay → startGame(selectedBook)`, so book-name identity never breaks mid-flow. Defense-in-depth: `startGame` guards empty pool (Quiz.jsx's `return null` guard is a dead-end blank screen, not graceful).
- Plurals: `count_one`/`count_other` in both catalogs is correct — verified on Node 20.11 that `Intl.PluralRules('fr').select(0)==='one'` and `('en').select(0)==='other'`.
- Curated fr→en book-name map module is the source of truth for both MT and FR/EN parity tests (ids identical, option counts equal, correctAnswers indices identical). Grouped pseudo-books exist in the data: "Épîtres", "Petits Prophètes", "Esdras-Néhémie", "1-2 Chroniques".
- MT review gate must flag versification divergence (Segond vs English numbering: Psaumes, Joël, Malachie) — references cannot be blindly translated.
- Emoji standardized into `aria-hidden` spans in Phase B — this breaks the plan's claim that FR test literals keep passing (`getByText('📖 Quiz Biblique')` etc. must become role-based queries).

**Why:** three-phase shape keeps FR users unaffected while the rename+seam work makes the codebase English-only per CLAUDE.md convention.
**How to apply:** future i18n/data work should go through the questions.js normalization seam and respect the HOME-only toggle invariant. Interacts with [[sessions-accounts-architecture]]: that plan's `livre` column / `.v1` key predate this rename — use `book` / `.v2` when building Supabase history.
