import frRaw from '../../data/quiz_biblique.json'
import enRaw from '../../data/quiz_biblique.en.json'

export const DEFAULT_LANG = 'fr'

// Maps a raw French-keyed question record from the source JSON to the app's
// internal English-keyed shape. The French source keeps its French keys (it is
// off-limits for edits); this normalizer is the single boundary where they are
// translated, so the rest of the app is English-only.
function normalizeFr(q) {
  return {
    id: q.id,
    book: q.livre,
    text: q.question,
    // Copy the arrays so a normalized bank never aliases the imported JSON —
    // keeps the source structurally immutable regardless of consumers.
    options: [...q.options],
    correctAnswers: [...q.reponses_correctes],
    correctCount: q.nombre_bonnes_reponses,
    reference: q.reference,
    difficulty: q.difficulte,
  }
}

// The English bank mirrors the French file's structure with English snake_case
// keys (question / correct_answers / number_of_correct_answers); map them to the
// internal shape (and copy arrays, as above).
function normalizeEn(q) {
  return {
    id: q.id,
    book: q.book,
    text: q.question,
    options: [...q.options],
    correctAnswers: [...q.correct_answers],
    correctCount: q.number_of_correct_answers,
    reference: q.reference,
    difficulty: q.difficulty,
  }
}

// One normalized bank per language. `pickQuestions`/`getBooks` select by `lang`.
const banks = {
  fr: frRaw.questions.map(normalizeFr),
  en: enRaw.questions.map(normalizeEn),
}

function bank(lang) {
  return Object.hasOwn(banks, lang) ? banks[lang] : banks[DEFAULT_LANG]
}

// Dev-only data validation: warns at module load about questions whose declared
// correct-answer count doesn't match the indices, duplicate options, or
// out-of-range correct indices. Runs on every bank. A test asserts the real data
// emits zero warnings.
if (import.meta.env.DEV) {
  for (const [lang, questions] of Object.entries(banks)) {
    for (const q of questions) {
      if (q.correctAnswers.length !== q.correctCount) {
        console.warn(
          `[${lang}] Data mismatch for ${q.id}: ${q.correctAnswers.length} correct index(es) but declared count = ${q.correctCount}`,
        )
      }
      if (new Set(q.options).size !== q.options.length) {
        console.warn(`[${lang}] Duplicate options for ${q.id}`)
      }
      if (q.correctAnswers.some((i) => i < 0 || i >= q.options.length)) {
        console.warn(`[${lang}] Correct-answer index out of range for ${q.id}`)
      }
    }
  }
}

// Books in file order (biblical order), with their question counts, for the
// given language. Map preserves insertion order, so biblical order is kept.
export function getBooks(lang = DEFAULT_LANG) {
  const counts = new Map()
  for (const q of bank(lang)) {
    counts.set(q.book, (counts.get(q.book) ?? 0) + 1)
  }
  return [...counts].map(([book, count]) => ({ book, count }))
}

// Fisher–Yates shuffle (on a copy, never mutating the original).
function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Draws up to `n` random questions from a book (in the given language), also
// shuffling each question's options and remapping the correct-answer indices to
// the new order (sorted ascending).
export function pickQuestions(book, n = 10, lang = DEFAULT_LANG) {
  const pool = bank(lang).filter((q) => q.book === book)
  const selected = shuffle(pool).slice(0, Math.min(n, pool.length))

  return selected.map((q) => {
    const order = shuffle(q.options.map((_, i) => i))
    return {
      ...q,
      options: order.map((i) => q.options[i]),
      correctAnswers: q.correctAnswers
        .map((orig) => order.indexOf(orig))
        .sort((a, b) => a - b),
    }
  })
}
