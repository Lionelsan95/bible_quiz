---
name: difficulty-mode-plan
description: Decisions for the quiz-by-difficulty mode (planned 2026-07-19) — canonical difficulty values, v2-additive history, gameConfig state, single setup screen
metadata:
  type: project
---

Architectural decisions for the "quiz by difficulty" mode (plan stage 2026-07-19 — verify against code before relying):

- **Data facts (verified 2026-07-19)**: FR bank `difficulte` = facile 111 / moyen 242 / difficile 151 (504 total). EN bank carries `difficulty` = easy 111 / medium 242 / hard 151 with exact per-id parity (facile→easy, moyen→medium, difficile→hard). Smallest pool 111 ≥ max requested count 20 in both languages — no fallback behavior needed for English.
- **Canonical difficulty values**: normalize both banks to `'easy' | 'medium' | 'hard'` inside `normalizeFr`/`normalizeEn` (fr map lives in new `src/data/difficulties.js`, mirroring `bookNames.js`). `difficulty` was previously normalized but unused by any UI, so canonicalizing is behavior-neutral. Canonical values double as i18n catalog key suffixes (`difficulty.easy` …) and as stable history values.
- **Selectors**: sibling functions `getDifficulties(lang)` + `pickQuestionsByDifficulty(difficulty, n, lang)` — do NOT overload `pickQuestions`. Shared private `draw(pool, n)` helper holds the Fisher-Yates + option-shuffle + index-remap logic (never duplicate it).
- **History**: stay on the `.v2` key with additive optional fields (`mode: 'book'|'difficulty'`, `difficulty`), NOT a v3 migration. `isValidAttempt` widened to accept book-less difficulty records. Accepted risk: an old tab/rollback saving an attempt clobbers difficulty records (its readAll filters them, then rewrites). Chosen because the Supabase phase ([[sessions-accounts-architecture]]) will supersede local schema anyway.
- **App state**: single `gameConfig` object (`{ mode:'book', book } | { mode:'difficulty', difficulty, count }`) replaces `selectedBook`; `startGame(config)` dispatches on mode. Replay in difficulty mode = fresh draw, same difficulty+count.
- **Navigation**: one new screen `SCREENS.DIFFICULTY` (`DifficultySetup` component: difficulty group + count group [5/10/15/20] + start), entered from a button on HOME above the book grid (option chosen over a mode-chooser landing screen to keep the existing book flow zero-extra-clicks). LanguageToggle stays HOME-only — invariant holds; canonical difficulties + fr/en parity make difficulty replay language-safe anyway.
- **Parity test extension**: `enBankParity.test.js` gains a per-id difficulty parity assertion via the fr→canonical map; DEV validation in questions.js gains an unknown-difficulty warning so the existing zero-warnings test guards both banks.

**Why:** requested feature (book mode + difficulty mode with 5/10/15/20 count) had to fit the off-limits banks, the historyStore seam, and the HOME-only LanguageToggle invariant.
**How to apply:** future modes (e.g. "whole Bible random") should extend `gameConfig` + add a sibling selector over the shared `draw()` helper, and store additive optional history fields rather than bumping the storage key. See [[i18n-english-flip-plan]] for the normalization-seam rationale.
