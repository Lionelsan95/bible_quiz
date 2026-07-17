import rawData from '../../data/quiz_biblique.json'

// Maps a raw French-keyed question record from the source JSON to the app's
// internal English-keyed shape. The source JSON keeps its French keys (it is
// off-limits for edits); this normalizer is the single boundary where they are
// translated, so the rest of the app is English-only.
function normalizeFr(q) {
  return {
    id: q.id,
    book: q.livre,
    text: q.question,
    options: q.options,
    correctAnswers: q.reponses_correctes,
    correctCount: q.nombre_bonnes_reponses,
    reference: q.reference,
    difficulty: q.difficulte,
  }
}

const questions = rawData.questions.map(normalizeFr)

// Dev-only data validation: warns at module load about questions whose declared
// correct-answer count doesn't match the indices, duplicate options, or
// out-of-range correct indices. A test asserts the real data emits zero warnings.
if (import.meta.env.DEV) {
  for (const q of questions) {
    if (q.correctAnswers.length !== q.correctCount) {
      console.warn(
        `Data mismatch for ${q.id}: ${q.correctAnswers.length} correct index(es) but nombre_bonnes_reponses = ${q.correctCount}`,
      )
    }
    if (new Set(q.options).size !== q.options.length) {
      console.warn(`Duplicate options for ${q.id}`)
    }
    if (q.correctAnswers.some((i) => i < 0 || i >= q.options.length)) {
      console.warn(`Correct-answer index out of range for ${q.id}`)
    }
  }
}

// Books in file order (biblical order), with their question counts.
// Map preserves insertion order, so biblical order is kept.
export function getBooks() {
  const counts = new Map()
  for (const q of questions) {
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

// Draws up to `n` random questions from a book, also shuffling each question's
// options (and remapping the correct-answer indices to the new order).
export function pickQuestions(book, n = 10) {
  const pool = questions.filter((q) => q.book === book)
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
