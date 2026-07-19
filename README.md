# 📖 Bible Quiz

A **bilingual (French / English)** Bible quiz web app, built with **React 18** and **Vite 6**. The user either picks a book of the Bible and answers 10 randomly drawn questions, or picks a difficulty level and a question count and answers questions of that level drawn from every book. Either way they see their score with an encouraging message. The app also keeps a **local history** of past games and offers a **light / dark theme**.

## Gameplay

1. **Home** — A grid of cards lists the 32 available books (or groups of books), each with its question count (e.g. "Genèse — 40 questions"). The header has a **FR / EN language toggle**, a **theme toggle** (light / dark / auto) is always visible, and and there are **🎯 Play by difficulty** and **📊 My history** buttons.
2. **Difficulty setup** (difficulty mode only) — Pick a level (**Easy** / **Medium** / **Hard**, each showing its question count) and how many questions you want (**5 / 10 / 15 / 20**, default 10), then start. Questions are drawn at random from that level across **all** books.
3. **Quiz** — In book mode, 10 questions are drawn at random from the chosen book (fewer if it has fewer than 10); in difficulty mode, the chosen number from the chosen level. Option order is shuffled each game. Two modes:
   - **Single answer**: clicking an option submits the answer immediately.
   - **Multiple answers**: a hint "Choose N answers then submit" appears; you select/deselect options, and the **Submit** button enables once the right number of answers is checked.

   After each answer, correct options are highlighted green, wrong choices red, and the verse reference is shown ("Correct answer! 📖 Reference: Genesis 1"). A progress bar and a "← Quit" button are always visible.
4. **Results** — Score out of the number of questions played, percentage of correct answers, and an encouraging message based on the ratio (≥ 90%: "Excellent!", ≥ 70%: "Well done!", ≥ 50%: "Not bad", otherwise: "Keep reading the Bible"). Three actions: **Replay this book** (fresh draw) — or **Replay this level** in difficulty mode, **Choose another book** / **Back to home**, or **My history**.
5. **History** — The list of finished games (book *or* difficulty level, score, localized date), with a loading state and an empty state. History is **local to the browser** (no sync, no account) — see [Local history](#local-history).

## Languages (i18n)

The interface text is internationalized with **react-i18next** (French by default, English available). The **FR / EN** toggle on the home screen switches language on the fly; the choice is persisted (`localStorage`, key `quiz-biblique.lang`) and also drives `<html lang>` and the tab title.

The **questions themselves are bilingual**: a French bank (`data/quiz_biblique.json`) and an English bank (`data/quiz_biblique.en.json`) are kept in strict parity. See the **Data format** section below.

> The language toggle appears **only on the home screen**, by design: the language can only change before a game starts, which avoids replaying a book that has no questions in the newly selected language.

## Light / dark theme

A **theme selector** (☀️ light / 🌙 dark / 🌗 auto) is present on every screen. The **auto** mode follows the operating system preference (`prefers-color-scheme`) and updates live if it changes. The choice is persisted (`localStorage`, key `quiz-biblique.theme`). A small inline script in `index.html` applies the theme **before the first paint** to avoid a light flash. All styling is driven by CSS variables; dark mode redefines them under `:root[data-theme='dark']`.

## Local history

Every finished game is recorded by `src/history/localHistory.js` in `localStorage` (versioned key `quiz-biblique.attempts.v2`, shape `{ id, mode, book?, difficulty?, score, total, completedAt }`, max 100 entries, newest first). Access goes through an async interface `src/history/historyStore.js` (`saveAttempt` / `listAttempts`) — designed as the plug point for a future remote backend. Every write is best-effort (wrapped in `try/catch`) and never blocks the UI.

## Requirements

- **Node.js** ≥ 20 (tested with Node 20.11) and **npm**.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Vite starts a dev server (by default at http://localhost:5173).

## Production build

```bash
npm run build     # generates the dist/ folder
npm run preview   # serves the build locally for verification
```

## Code quality

```bash
npm run lint      # ESLint (flat config: react-hooks, jsx-a11y, Prettier compat)
npm run format    # Prettier --write (formats the code)
```

## Tests

```bash
npm test            # runs the suite once (vitest run)
npm run test:watch  # watch mode (vitest)
```

The suite has **143 tests** across **14 files**, written with **Vitest**, **Testing Library** (`@testing-library/react`, `@testing-library/user-event`) and the `@testing-library/jest-dom` matchers. The test environment is `jsdom` (configured in `vite.config.js`, with `globals: true` and the `src/test/setup.js` setup).

> **Note:** `jsdom` is pinned to v25 (`^25.0.1`) to stay compatible with Node 20.11 (newer jsdom versions require a newer Node).

Test coverage:

- `src/App.test.jsx` — full flow home → quiz → results → replay / change book / quit, the difficulty mode flow (setup → quiz → results → replay, back to home, no language toggle on the setup screen), access to history, and a mid-quiz theme change without losing state (the data module is mocked to make the draw deterministic).
- `src/components/QuestionCard.test.jsx` — single and multiple modes, `correct`/`wrong`/`dimmed` CSS classes, `aria-pressed` and `aria-disabled` attributes, "Correct/Wrong answer" announcement, clicks ignored after reveal.
- `src/components/Quiz.test.jsx` — progression, `role="progressbar"`, next button, final score passed to `onFinish`, empty list handled without crashing.
- `src/components/Results.test.jsx` — score, percentage, per-tier messages, `total = 0` case without `NaN`, and the difficulty-mode action wording.
- `src/components/DifficultySetup.test.jsx` — level and count options, `aria-pressed` selection, defaults, values passed to `onStart`, and a level with no questions marked `aria-disabled` and unselectable.
- `src/components/HistoryScreen.test.jsx` — loading, empty, and populated history states, plus difficulty attempts shown with their translated level (falling back to the raw id).
- `src/components/LanguageToggle.test.jsx` — FR/EN rendering, `aria-pressed`, language switch and persistence.
- `src/components/ThemeToggle.test.jsx` — rendering of the three modes, `aria-pressed`, theme switch and persistence.
- `src/data/questions.test.js` — biblical order preserved, per-book counts, bounded draw, option shuffling with correct index remapping, source data not mutated, language parameter (`getBooks(lang)` / `pickQuestions(book, n, lang)`), the difficulty selectors (`getDifficulties(lang)` / `pickQuestionsByDifficulty(difficulty, n, lang)`: per-level counts, cross-book pooling, raw French values rejected), dev validation with no warnings on both banks.
- `src/data/bookNames.test.js` — the FR → EN map covers every book present in the data.
- `src/data/enBankParity.test.js` — strict FR ↔ EN parity (same `id`s, same option counts, same correct indices, matching book names, matching difficulty).
- `src/history/localHistory.test.js` — read/write, cap, tolerance to corrupt data, v1 → v2 migration, and difficulty attempts (round-trip, `mode` defaulting, legacy records without `mode` still valid).
- `src/i18n/catalogs.test.js` — the `fr` and `en` catalogs have exactly the same keys.
- `src/theme/theme.test.js` — light/dark/auto resolution, following the system preference, persistence, resilience when storage is unavailable.

## Project structure

```
bible_gaming/
├── index.html                     # Root HTML page + pre-paint theme script (anti-flash)
├── vite.config.js                 # Vite config + Vitest test config (jsdom)
├── eslint.config.js               # ESLint config (flat config)
├── .prettierrc.json               # Prettier config
├── package.json
├── data/
│   ├── quiz_biblique.json         # 504 FR questions, 32 books/groups (source, manual edits only)
│   └── quiz_biblique.en.json      # 504 EN questions (strict parity with the FR bank)
└── src/
    ├── main.jsx                   # React entry point (+ i18n and theme imports)
    ├── styles.css                 # Global styles + dark palette (:root[data-theme='dark'])
    ├── App.jsx                    # Screen state machine (home / difficulty / quiz / results / history)
    ├── components/
    │   ├── BookSelect.jsx         # Home: book grid + difficulty/history entry points
    │   ├── DifficultySetup.jsx    # Difficulty mode: level picker + question-count picker
    │   ├── Quiz.jsx               # Quiz orchestration: progression, score, navigation
    │   ├── QuestionCard.jsx       # Renders one question (single or multiple)
    │   ├── Results.jsx            # Results screen: score, percentage, message
    │   ├── HistoryScreen.jsx      # Local history of past games
    │   ├── LanguageToggle.jsx     # FR / EN toggle (home only)
    │   └── ThemeToggle.jsx        # Light / dark / auto toggle (global)
    ├── data/
    │   ├── questions.js           # Loads + normalizes both banks;
    │   │                          #   getBooks(lang), pickQuestions(book, n, lang)
    │   ├── bookNames.js           # FR → EN book-name map
    │   └── difficulties.js        # Canonical level ids, FR→canonical map, count options
    ├── history/
    │   ├── localHistory.js        # localStorage storage (versioned key, v1→v2 migration)
    │   └── historyStore.js        # Async interface (saveAttempt / listAttempts)
    ├── i18n/
    │   ├── index.js               # react-i18next init (default fr, persistence)
    │   └── locales/
    │       ├── fr/translation.json
    │       └── en/translation.json
    ├── theme/
    │   └── theme.js               # light/dark/auto theme store + useTheme() hook
    └── test/
        ├── setup.js               # Vitest setup (jest-dom, i18n, theme reset)
        └── matchMedia.js          # matchMedia stub for jsdom
```

## Data format (`data/quiz_biblique.{json,en.json}`)

The app loads **two** question banks and normalizes them, at load time (`src/data/questions.js`), into an internal **English-keyed** shape: `{ id, book, text, options, correctAnswers, correctCount, reference, difficulty }`. `getBooks(lang)`, `getDifficulties(lang)`, `pickQuestions(book, n, lang)` and `pickQuestionsByDifficulty(difficulty, n, lang)` select the bank by language (`fr` by default).

**French bank — `data/quiz_biblique.json`** (source of truth, French keys). An object with `titre`, `description`, `total_questions` (504) and a `questions` array; each question has the shape:

```json
{
  "id": "gen_001",
  "livre": "Genèse",
  "question": "En combien de jours Dieu crée-t-il le monde selon Genèse 1 ?",
  "options": ["6 jours", "7 jours", "3 jours", "40 jours"],
  "reponses_correctes": [0],
  "nombre_bonnes_reponses": 1,
  "reference": "Genèse 1",
  "difficulte": "facile"
}
```

| Field | Description |
|---|---|
| `id` | Unique identifier (book prefix + number), used as the React `key` |
| `livre` | Book name, as shown on the home screen (order of appearance in the file defines display order) |
| `question` | The question text |
| `options` | 4 answer options (unique texts) |
| `reponses_correctes` | 0-based indices of the correct answers in `options` — 1 or 2 items |
| `nombre_bonnes_reponses` | Must equal `reponses_correctes.length` (checked in dev) |
| `reference` | Bible reference shown after the answer |
| `difficulte` | Difficulty level: `facile` / `moyen` / `difficile`. Canonicalized to `easy`/`medium`/`hard` on load (`src/data/difficulties.js`) and used to pool questions for difficulty mode |

**English bank — `data/quiz_biblique.en.json`.** Same structure, but with English `snake_case` keys: `book`, `question`, `options`, `correct_answers`, `number_of_correct_answers`, `reference`, `difficulty`. Each entry shares the `id` of its French counterpart, and the book name (`book`) comes from the `src/data/bookNames.js` map (`BOOK_NAMES_FR_TO_EN`).

## Accessibility

- **`aria-live="polite"`** — The result announcement region ("Correct answer! … Reference: …") stays permanently mounted in `QuestionCard`, so screen readers read the announcement when it appears.
- **`aria-pressed`** — In multiple-answer mode, each option behaves as a toggle button; the language and theme toggles likewise expose the active option.
- **`aria-disabled`** — After the answer is revealed, options are marked `aria-disabled="true"` (with clicks ignored in JS) rather than `disabled`, so they stay focusable and readable by assistive technology.
- **`role="progressbar"`** — The quiz progress bar exposes `aria-valuenow` / `aria-valuemin` / `aria-valuemax` and a descriptive `aria-label`.
- **`prefers-color-scheme`** — The **auto** theme follows the system light/dark preference; the theme/language toggles use `role="group"` and `aria-pressed`.
- **`prefers-reduced-motion`** — Animations are reduced via a media query for users who request it.
- **`:focus-visible`** — A visible focus outline is applied for keyboard navigation.
- Decorative emoji are always hidden from screen readers with `aria-hidden="true"`.

## Adding questions

> ⚠️ The data files (`data/quiz_biblique.json` and `data/quiz_biblique.en.json`) are **product content, edited manually only** — no automated tooling should modify them. Any new question must be added **to both banks**, in parity.

1. In `data/quiz_biblique.json`, add an object to the `questions` array following the French format above:
   - unique `id` (convention: book prefix + number, e.g. `gen_041`);
   - `options` without duplicates;
   - `reponses_correctes`: valid indices (between 0 and `options.length - 1`);
   - `nombre_bonnes_reponses` equal to the length of `reponses_correctes`.
2. Add the **matching English entry** in `data/quiz_biblique.en.json`: **same `id`**, book name (`book`) taken from `src/data/bookNames.js`, `snake_case` keys (`question`, `correct_answers`, `number_of_correct_answers`…), same option count and same correct indices as the French version.
3. For a **new book**, use a new name in `livre` (FR) and add the mapping to `BOOK_NAMES_FR_TO_EN` (`src/data/bookNames.js`); it will appear automatically on the home screen, at its position of appearance in the file (keep biblical order).
4. Run `npm run dev`: a dev-mode validation (`src/data/questions.js`) logs a console warning if `nombre_bonnes_reponses` is inconsistent, if options are duplicated, if a correct-answer index is out of range, or if `difficulte` is not one of `facile`/`moyen`/`difficile` (across both banks).
5. Run `npm test`: the suite checks, among other things, that there are no warnings on the real data **and the FR ↔ EN parity** (`src/data/enBankParity.test.js`) — the tests fail if the two banks drift.
