// Canonical difficulty ids, in ascending display order.
//
// The source banks disagree on spelling — the French file stores `difficulte`
// as facile/moyen/difficile, the English one stores `difficulty` as
// easy/medium/hard — so `normalizeFr` maps the French values through
// DIFFICULTY_FR_TO_CANONICAL and the rest of the app only ever sees these ids.
// They are also intended as i18n catalog key suffixes (`difficulty.easy`, …)
// once the picker UI lands, which is why display labels will need no bank edit:
// both banks are off-limits for automated edits, so every fr -> canonical
// mapping lives here instead.
export const DIFFICULTIES = ['easy', 'medium', 'hard']

export const DIFFICULTY_FR_TO_CANONICAL = {
  facile: 'easy',
  moyen: 'medium',
  difficile: 'hard',
}

// Question-count options offered when starting a difficulty quiz. Lives here
// rather than in the picker component so the data-layer test asserting every
// level can satisfy the largest draw stays tied to the real value.
export const QUESTION_COUNTS = [5, 10, 15, 20]
