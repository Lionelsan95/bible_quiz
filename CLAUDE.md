# CLAUDE.md

French-language Bible quiz app (React 18 + Vite 6). Pick a book, answer 10 random questions, see your score.

## Commands

```bash
npm run dev         # Vite dev server
npm run build       # production build to dist/
npm test            # vitest run (43 tests, 5 files)
npm run test:watch  # vitest watch mode
```

## Architecture

`src/App.jsx` is a screen state machine driven by the `SCREENS` constants (`HOME` / `QUIZ` / `RESULTS`); it holds the selected book, the drawn questions, and the final score. Quiz data is static: `src/data/questions.js` imports `data/quiz_biblique.json` (504 questions, 32 books) at build time — no fetching. `pickQuestions(livre, n)` Fisher-Yates-shuffles the book's pool, takes up to `n`, and shuffles each question's options while remapping `reponses_correctes` indices to the new order (sorted ascending); source data is never mutated. `Quiz.jsx` remounts `QuestionCard` between questions via `key={question.id}`, which resets the card's local selection/reveal state.

## Non-obvious gotchas

- Option buttons in `QuestionCard.jsx` use `aria-disabled` (with clicks ignored in JS) instead of `disabled` after reveal, so they stay focusable. Tests assert on `aria-disabled="true"` and CSS selects `.option[aria-disabled='true']` — do not switch to `disabled`.
- `jsdom` is pinned to v25 (`^25.0.1`) in devDependencies for Node 20.11 compatibility. Do not bump it without checking the Node version.
- `src/data/questions.js` runs dev-only data validation (`import.meta.env.DEV`) at module load: warns on `nombre_bonnes_reponses` mismatch, duplicate options, and out-of-range correct indices. A test (`src/data/questions.test.js`) asserts the real data produces zero warnings, so invalid data added to the JSON fails the suite.
- Vitest config lives inside `vite.config.js` (`test` key: jsdom, globals, setup file `src/test/setup.js`).
- The `aria-live="polite"` paragraph in `QuestionCard` must stay permanently mounted (content rendered conditionally inside it) for screen readers to announce the result.
