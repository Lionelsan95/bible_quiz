# CLAUDE.md

French-language Bible quiz app (React 18 + Vite 6). Two play modes: pick a book and answer 10 random questions, or pick a difficulty level and a question count (5/10/15/20) and answer questions of that level pooled across every book. Either way, see your score.

## Commands

```bash
npm run dev         # Vite dev server
npm run build        # production build to dist/
npm test             # vitest run
npm run test:watch   # vitest watch mode
npm run lint          # eslint
npm run format        # prettier --write
```

## Architecture

`src/App.jsx` is a screen state machine driven by the `SCREENS` constants (`HOME` / `DIFFICULTY` / `QUIZ` / `RESULTS` / `HISTORY`); it holds the drawn questions, the final score, and a **`gameConfig` discriminated union** describing what the current game was drawn from — either `{ mode: 'book', book }` or `{ mode: 'difficulty', difficulty, count }`. It is kept whole rather than as loose fields so replay can redraw from exactly the same configuration; a derived `gameLabel` (book name, or the translated level) is what `Quiz`/`Results` display via their `label` prop. Quiz data is static: `src/data/questions.js` imports `data/quiz_biblique.json` (32 books) at build time — no fetching. **`normalizeFr(q)` is the single boundary where the source JSON's French keys are mapped to the app's internal English shape** (`livre→book`, `question→text`, `reponses_correctes→correctAnswers`, `nombre_bonnes_reponses→correctCount`, `difficulte→difficulty`) — the JSON keeps its French keys (it is off-limits to edit); the rest of the app is English-only. Note `difficulte` is the one field whose **value** is also translated, not just its key (see the difficulty section below). `pickQuestions(book, n)` and `pickQuestionsByDifficulty(difficulty, n)` both delegate to a shared private `draw(pool, n)`, which Fisher-Yates-shuffles the pool, takes up to `n`, and shuffles each question's options while remapping `correctAnswers` indices to the new order (sorted ascending); source data is never mutated. **That remap is subtle — never duplicate it in a new selector, add a filter and call `draw`.** `Quiz.jsx` remounts `QuestionCard` between questions via `key={question.id}`, which resets the card's local selection/reveal state. Note: this remount approach will silently drop any future per-question local state (e.g. a timer) — revisit before adding one. `finishGame()` also records the finished attempt via `saveAttempt()` from `history/historyStore.js` (fire-and-forget — a failed save never blocks showing results) before moving to `RESULTS`.

### Difficulty mode

`src/data/difficulties.js` holds the canonical level ids `DIFFICULTIES = ['easy', 'medium', 'hard']` (ascending display order), the `DIFFICULTY_FR_TO_CANONICAL` map (`facile`/`moyen`/`difficile`), and `QUESTION_COUNTS = [5, 10, 15, 20]`. The two banks disagree on spelling — the French file stores `difficulte` in French, the English one stores `difficulty` in English — and **both are off-limits for edits**, so `normalizeFr` canonicalizes through that map and the rest of the app sees one vocabulary. Consequences: raw French values (`'facile'`) are not valid input to any selector, and the canonical ids double as i18n key suffixes (`` t(`difficulty.${id}`) ``), which is how levels are displayed translated without touching the banks. `getDifficulties(lang)` returns `{ difficulty, count }` per level; **unlike `getBooks`, a level with no questions reports `count: 0` rather than disappearing**, because the picker needs a stable set — `DifficultySetup` marks such a level `aria-disabled` and starts on the first playable one. `src/components/DifficultySetup.jsx` is the setup screen (level picker + count picker, `aria-pressed`, no `LanguageToggle`); `BookSelect` reaches it via an optional `onPlayByDifficulty` prop, mirroring `onShowHistory`. `Results` takes a `mode` prop that only switches its two action labels (`results.replayDifficulty`/`results.backHome` vs `results.replay`/`results.changeBook`) — both paths keep the same handlers. Book mode is unchanged and still fixed at 10 questions; extending the count picker to it would need a "fewer available" UX for small books.

### Quiz history (Phase 1, local-only)

`src/history/localHistory.js` is a pure localStorage module (key `quiz-biblique.attempts.v2`, records shaped `{ id, mode: 'book' | 'difficulty', book?, difficulty?, score, total, completedAt }`, capped at 100 entries, validates each record's shape on read, newest-first, all access wrapped in try/catch so a full/unavailable store never breaks the quiz). A lazy, idempotent `migrateV1()` runs inside `readAll()`: if the `.v2` key is absent it carries valid `.v1` records forward, mapping the old `livre` key to `book`, and leaves `.v1` in place for rollback safety. `src/history/historyStore.js` re-exports the same **async** interface (`saveAttempt`, `listAttempts`) delegating to `localHistory` — it is the intended seam for a future authenticated/remote backend, so **UI code imports from `historyStore`, never `localHistory` directly**. `mode` was added **additively within v2** (no v3 key): a record is identified by either a `book` string or `mode === 'difficulty'` plus a `difficulty` string, and records predating the field — all existing v2 and migrated-v1 data — have no `mode` at all, so a bare `book` must stay sufficient. See the compat gotcha below. `src/components/HistoryScreen.jsx` consumes it with a loading/empty/list tri-state and locale-aware `Intl.DateTimeFormat(i18n.language)` dates, plus a back button; a difficulty attempt renders its **translated** level (with the raw id as `defaultValue`), so unlike a book name — frozen in the language it was played in — a stored level follows the current UI language. Entry points are an optional history button on `BookSelect` (home) and `Results`, both gated behind an optional `onShowHistory` prop. There is no login/account — history is per-browser only (accounts are a deliberately deferred Phase 2/3).

### Internationalization (i18n, react-i18next)

All UI chrome is translated via **react-i18next** (`src/i18n/index.js`): a synchronous, bundled-resources init (no backend plugin), `useSuspense: false`, default/fallback language `fr`, with the choice persisted to `localStorage['quiz-biblique.lang']` and `<html lang>` + `document.title` kept in sync on `languageChanged`. Catalogs live at `src/i18n/locales/{fr,en}/translation.json`; components call `useTranslation()`/`t()`. `main.jsx` imports `./i18n/index.js` **before** the App module graph. A `LanguageToggle` (FR/EN) renders **home-screen only** — see gotcha below.

**Quiz content** is locale-aware too (Phase C): `src/data/questions.js` normalizes a French bank (`data/quiz_biblique.json`, French keys via `normalizeFr`) and an English bank (`data/quiz_biblique.en.json`, authored in the internal shape) into `banks = { fr, en }`; `getBooks(lang)` / `getDifficulties(lang)` / `pickQuestions(book, n, lang)` / `pickQuestionsByDifficulty(difficulty, n, lang)` select by `i18n.language` (fallback `fr`). `App.jsx` passes the language and guards an empty pool by staying put. `src/data/bookNames.js` (`BOOK_NAMES_FR_TO_EN`) is the curated fr→en name map (single source of truth for the en bank + parity tests). The English bank is the **full 504-question** user-authored translation; it uses English snake_case keys (`question`/`correct_answers`/`number_of_correct_answers`) which `normalizeEn` maps to the internal shape. `src/data/enBankParity.test.js` enforces full fr↔en structural parity (identical ids, option counts, correct indices, mapped book names, and mapped difficulty — a mistranslated level would silently change what an English player is served, since difficulty mode pools by level across all books).

### Theming (light / dark / auto)

`src/theme/theme.js` is a small external store mirroring the i18n pattern: preference `'light' | 'dark' | 'auto'` (default `auto` = follow OS), persisted to `localStorage['quiz-biblique.theme']`; only the **resolved** value is written to `document.documentElement[data-theme]`, and CSS keys off `[data-theme='dark']`. `useTheme()` exposes it via `useSyncExternalStore` (cached snapshot). A guarded `matchMedia` listener live-updates only when the pref is `auto`. `ThemeToggle` (a global control in `App.jsx`'s `.app-toolbar`, rendered on every screen) drives it; `index.html` has a pre-paint inline script that sets `data-theme` before first paint (FOUC guard). All theming is CSS-variable driven — `styles.css` has a `:root` light palette and a `:root[data-theme='dark']` override.

## Code style

- **Formatting**: Prettier, no manual overrides — run `npm run format` before committing, don't hand-format.
- **Linting**: ESLint with `eslint-plugin-react-hooks` (official React team rules — enforces Rules of Hooks and exhaustive deps) and `eslint-plugin-jsx-a11y` (accessibility). Baseline rules follow Airbnb's JavaScript style guide where not superseded by the above.
- **Language**: code, identifiers, comments, and commit messages are in English, following standard open-source convention. UI chrome is internationalized via react-i18next (French default + English); add user-facing strings as catalog keys in **both** `src/i18n/locales/{fr,en}/translation.json`, never as hardcoded literals. Quiz content in `data/quiz_biblique.json` is French product content, not code; this split is intentional.

## Non-obvious gotchas

- Option buttons in `QuestionCard.jsx` use `aria-disabled` (with clicks ignored in JS) instead of `disabled` after reveal, so they stay focusable. Tests assert on `aria-disabled="true"` and CSS selects `.option[aria-disabled='true']`. **This applies to any future interactive quiz element, not just `QuestionCard`** — never use the native `disabled` attribute on an option-style control.
- `jsdom` is pinned to v25 (`^25.0.1`) in devDependencies for Node 20.11 compatibility. Do not bump it without checking the Node version.
- `src/data/questions.js` runs dev-only data validation (`import.meta.env.DEV`) at module load over **both** language banks: warns on declared-correct-count mismatch, duplicate options, out-of-range correct indices, and an unknown/uncanonicalized difficulty. A test (`src/data/questions.test.js`) asserts the real data produces zero warnings, so invalid data added to either JSON bank fails the suite. `src/data/bookNames.test.js` and `src/data/enBankParity.test.js` further guard the fr↔en mapping and sample parity.
- Vitest config lives inside `vite.config.js` (`test` key: jsdom, globals, setup file `src/test/setup.js`).
- The `aria-live="polite"` paragraph in `QuestionCard` must stay permanently mounted (content rendered conditionally inside it) for screen readers to announce the result. **Applies to any future component that announces a result or state change.**
- **History `mode` is additive within v2, and that carries an accepted risk.** An old app version reads these records with a validator that requires `book`, so it *filters out* difficulty attempts — graceful display degradation, no crash. But if that old version then **saves** an attempt, it rewrites the store from its filtered read and the difficulty records are gone. This was accepted over a v3 key (which would add a second migration chain and a split store) for a per-browser history capped at 100, with a remote backend planned anyway. If you add another mode, extend `isValidAttempt` the same way — and never make `mode` required.
- History persistence (`history/localHistory.js`) is best-effort: all localStorage access is wrapped in try/catch (private-browsing / quota errors are swallowed) and `saveAttempt` in `App.jsx` is fire-and-forget — a storage failure must never block the results screen. `listAttempts()` filters out malformed stored records, so a corrupt store degrades to an empty history rather than throwing.
- The `LanguageToggle` is rendered **only on the home screen**, and this is a load-bearing invariant, not styling: language can change only from HOME, so an in-progress quiz or a `Results` replay can never re-pick a book that has no questions in the newly selected language. Keep it HOME-only — this now includes the `DifficultySetup` screen, which deliberately renders no toggle (an App test asserts its absence).
- Tests initialize the i18n singleton via `src/test/setup.js` (`import '../i18n/index.js'`) so `t()` returns real strings, plus a global `afterEach` resetting the language to `fr` (i18next is a singleton — otherwise a toggle test leaks `en` into later tests). `src/i18n/catalogs.test.js` asserts the `fr`/`en` catalogs have identical key sets — a new string missing from one locale fails the suite.
- Decorative emoji live in `aria-hidden` `<span>`s in markup, never inside translated strings, so screen readers don't announce them and accessible names stay clean. Follow this when adding emoji to any new UI.
- **CSS variable role-split for dark mode**: some palette vars are dual-role — a text/border colour *and* a solid background under white text — which one dark value can't satisfy. `styles.css` splits these: `--accent` (text/border) vs `--accent-bg` (button background), `--green`/`--green-solid`, `--red`/`--red-solid`, plus `--accent-hover` and `--surface-active`. Each new var's **light** value equals what it replaced, so light mode is unchanged. When adding a coloured element, pick the text/border var or the `-bg`/`-solid` var deliberately.
- The theme storage key `'quiz-biblique.theme'` is **duplicated in three places** — `index.html` (pre-paint FOUC script), `src/theme/theme.js`, and `src/test/setup.js`. Keep them in sync. Theme tests rely on `src/test/matchMedia.js` (jsdom has no `matchMedia`); `setup.js` installs the stub as a top-level statement and must **not** statically import `theme.js` (that would evaluate it before the stub exists). A global `afterEach` resets the theme singleton (like the i18n reset).
- `ThemeToggle` follows the same a11y contract as `LanguageToggle` — `aria-pressed`, **never native `disabled`**, `aria-hidden` emoji + translated `aria-label`. Unlike `LanguageToggle`, it is global (rendered on every screen from `App.jsx`); this is safe because a theme change is an attribute-only mutation that never remounts `QuestionCard` (its `key={question.id}` is theme-independent), so mid-quiz toggling preserves answer state.

## Boundaries

- `data/quiz_biblique.json` (French) is off-limits for automated edits. Changes are made manually only — no subagent or session should modify quiz content directly.
- `data/quiz_biblique.en.json` (English) is the user-authored/reviewed translation and is now **off-limits like the French file** — manual edits only, no subagent or session should modify quiz content directly. Both bank files are in `.prettierignore`.

## Workflow

Use these subagent chains depending on the size of the change. "Fix directly" means the main thread applies the correction itself — no dedicated agent for that step.

**Small edit**
write code → `code-improver` → fix directly if issues found (or delegate to `debugger` if it's a real bug, not a style issue) → `test-writer` → `test-runner` → `docs-sync-checker` → fix docs directly if needed → `secret-scanner` → `commit-writer`

**Large feature / refactor**
`architect` → write code → `code-improver` → fix directly (or `debugger` for real bugs) → `test-writer` → `test-runner` → `docs-sync-checker` → fix docs directly → `secret-scanner` → `commit-writer`

**Bug fix**
`debugger` → `test-writer` (regression test) → `test-runner` → `secret-scanner` → `commit-writer`

**Dependency maintenance** (periodic, not per-feature)
`dependency-auditor` → code adjustments if breaking changes → `test-runner` → `secret-scanner` → `commit-writer`

**Docs-only change**
`docs-sync-checker` → fix directly → `commit-writer`