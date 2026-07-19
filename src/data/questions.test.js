import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  getBooks,
  getDifficulties,
  pickQuestions,
  pickQuestionsByDifficulty,
} from './questions.js'
import { QUESTION_COUNTS } from './difficulties.js'
import quizData from '../../data/quiz_biblique.json'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rawJsonPath = resolve(__dirname, '../../data/quiz_biblique.json')

describe('getBooks', () => {
  it('preserves biblical order (order of appearance in the JSON)', () => {
    const raw = JSON.parse(readFileSync(rawJsonPath, 'utf-8'))
    const expectedOrder = []
    for (const q of raw.questions) {
      if (!expectedOrder.includes(q.livre)) expectedOrder.push(q.livre)
    }

    const books = getBooks()

    expect(books.map((b) => b.book)).toEqual(expectedOrder)
  })

  it('computes the correct question count per book', () => {
    const raw = JSON.parse(readFileSync(rawJsonPath, 'utf-8'))
    const expectedCounts = new Map()
    for (const q of raw.questions) {
      expectedCounts.set(q.livre, (expectedCounts.get(q.livre) ?? 0) + 1)
    }

    const books = getBooks()

    expect(books.length).toBe(expectedCounts.size)
    for (const { book, count } of books) {
      expect(count).toBe(expectedCounts.get(book))
    }
  })

  it('finds Genèse with 40 questions (known reference data)', () => {
    const books = getBooks()
    const genese = books.find((b) => b.book === 'Genèse')
    expect(genese).toEqual({ book: 'Genèse', count: 40 })
  })

  it('defaults to French when no language is given', () => {
    expect(getBooks()).toEqual(getBooks('fr'))
  })

  it('returns the English bank (all books) for lang="en"', () => {
    const books = getBooks('en')
    expect(books.length).toBe(32)
    expect(books.find((b) => b.book === 'Genesis')).toEqual({
      book: 'Genesis',
      count: 40,
    })
  })
})

describe('pickQuestions', () => {
  it('returns at most n questions', () => {
    const result = pickQuestions('Genèse', 5)
    expect(result.length).toBe(5)
  })

  it('never returns more questions than are available for the book', () => {
    const result = pickQuestions('Genèse', 1000)
    expect(result.length).toBe(40)
  })

  it('returns an empty array for an unknown book', () => {
    const result = pickQuestions('Livre Inexistant', 10)
    expect(result).toEqual([])
  })

  it('only returns questions from the requested book', () => {
    const result = pickQuestions('Genèse', 40)
    expect(result.length).toBe(40)
    for (const q of result) {
      expect(q.book).toBe('Genèse')
    }
  })

  it('shuffles options while correctly remapping correct answers', () => {
    const raw = JSON.parse(readFileSync(rawJsonPath, 'utf-8'))
    const originalById = new Map(raw.questions.map((q) => [q.id, q]))

    const result = pickQuestions('Genèse', 40)
    expect(result.length).toBe(40)

    for (const q of result) {
      const original = originalById.get(q.id)
      expect(original).toBeDefined()

      // The option set is preserved (same content, potentially different order).
      expect([...q.options].sort()).toEqual([...original.options].sort())
      expect(q.options.length).toBe(original.options.length)

      // Correct-answer indices are sorted ascending.
      const sorted = [...q.correctAnswers].sort((a, b) => a - b)
      expect(q.correctAnswers).toEqual(sorted)

      // The number of correct answers is unchanged.
      expect(q.correctAnswers.length).toBe(original.reponses_correctes.length)

      // The TEXT of the correct answers is preserved after index remapping.
      const remappedCorrectTexts = q.correctAnswers
        .map((i) => q.options[i])
        .sort()
      const originalCorrectTexts = original.reponses_correctes
        .map((i) => original.options[i])
        .sort()
      expect(remappedCorrectTexts).toEqual(originalCorrectTexts)
    }
  })

  it('does not mutate the source data', () => {
    const before = JSON.parse(JSON.stringify(quizData.questions))

    // Draw multiple times, including with more questions than available, to
    // maximize the chance of revealing an in-place mutation.
    pickQuestions('Genèse', 5)
    pickQuestions('Genèse', 1000)
    pickQuestions('Exode', 35)
    pickQuestions('Livre Inexistant', 10)

    expect(quizData.questions).toEqual(before)
  })

  it('handles n=0 by returning an empty array', () => {
    const result = pickQuestions('Genèse', 0)
    expect(result).toEqual([])
  })

  it('defaults to French when no language is given', () => {
    const result = pickQuestions('Genèse', 5)
    for (const q of result) {
      expect(q.book).toBe('Genèse')
    }
  })

  it('returns English questions for lang="en"', () => {
    const result = pickQuestions('Genesis', 10, 'en')
    expect(result.length).toBe(10)
    for (const q of result) {
      expect(q.book).toBe('Genesis')
      expect(typeof q.text).toBe('string')
      expect(q.text.length).toBeGreaterThan(0)
    }
  })

  it('falls back to French for an unknown/unsupported language', () => {
    const result = pickQuestions('Genèse', 40, 'de')
    expect(result.length).toBe(40)
    for (const q of result) {
      expect(q.book).toBe('Genèse')
    }
  })
})

// Known reference counts, verified against both source banks (they sum to 504,
// the full bank), following the `Genèse: 40` precedent above — safe to hardcode
// because both banks are off-limits for edits.
const EXPECTED_DIFFICULTY_COUNTS = [
  { difficulty: 'easy', count: 111 },
  { difficulty: 'medium', count: 242 },
  { difficulty: 'hard', count: 151 },
]

describe('getDifficulties', () => {
  it('returns the three levels in ascending order with their counts', () => {
    expect(getDifficulties()).toEqual(EXPECTED_DIFFICULTY_COUNTS)
  })

  it('reports identical counts for the English bank (fr/en parity)', () => {
    expect(getDifficulties('en')).toEqual(EXPECTED_DIFFICULTY_COUNTS)
  })

  it('defaults to French when no language is given', () => {
    expect(getDifficulties()).toEqual(getDifficulties('fr'))
  })

  it('falls back to French for an unknown/unsupported language', () => {
    expect(getDifficulties('de')).toEqual(getDifficulties('fr'))
  })

  // If this ever fails, the picker is offering a count some level cannot fill
  // and that level needs a "only N available" state — so keep it pinned to the
  // real QUESTION_COUNTS rather than a literal.
  it('leaves every level able to satisfy the largest offered draw', () => {
    const largest = Math.max(...QUESTION_COUNTS)
    for (const lang of ['fr', 'en']) {
      for (const { count } of getDifficulties(lang)) {
        expect(count).toBeGreaterThanOrEqual(largest)
      }
    }
  })
})

describe('pickQuestionsByDifficulty', () => {
  it('returns at most n questions', () => {
    expect(pickQuestionsByDifficulty('easy', 20).length).toBe(20)
  })

  it('only returns questions of the requested difficulty', () => {
    const result = pickQuestionsByDifficulty('hard', 20)
    expect(result.length).toBe(20)
    for (const q of result) {
      expect(q.difficulty).toBe('hard')
    }
  })

  it('pools questions across multiple books', () => {
    // The draw is random, but 20 questions from a 151-question pool spanning
    // many books effectively never lands entirely inside one book.
    const books = new Set(
      pickQuestionsByDifficulty('hard', 20).map((q) => q.book),
    )
    expect(books.size).toBeGreaterThan(1)
  })

  it('never returns more questions than the level has', () => {
    expect(pickQuestionsByDifficulty('easy', 1000).length).toBe(111)
  })

  it('returns an empty array for an unknown difficulty', () => {
    expect(pickQuestionsByDifficulty('impossible', 10)).toEqual([])
  })

  it('rejects raw French difficulty values (they are canonicalized)', () => {
    expect(pickQuestionsByDifficulty('facile', 10)).toEqual([])
  })

  it('handles n=0 by returning an empty array', () => {
    expect(pickQuestionsByDifficulty('easy', 0)).toEqual([])
  })

  it('shuffles options while preserving the correct-answer text', () => {
    const raw = JSON.parse(readFileSync(rawJsonPath, 'utf-8'))
    const originalById = new Map(raw.questions.map((q) => [q.id, q]))

    for (const q of pickQuestionsByDifficulty('medium', 20)) {
      const original = originalById.get(q.id)
      expect([...q.options].sort()).toEqual([...original.options].sort())
      expect(q.correctAnswers).toEqual(
        [...q.correctAnswers].sort((a, b) => a - b),
      )
      expect(q.correctAnswers.map((i) => q.options[i]).sort()).toEqual(
        original.reponses_correctes.map((i) => original.options[i]).sort(),
      )
    }
  })

  it('returns English questions for lang="en"', () => {
    const result = pickQuestionsByDifficulty('easy', 10, 'en')
    expect(result.length).toBe(10)
    for (const q of result) {
      expect(q.difficulty).toBe('easy')
      expect(q.text.length).toBeGreaterThan(0)
    }
  })

  it('falls back to French for an unknown/unsupported language', () => {
    const result = pickQuestionsByDifficulty('easy', 1000, 'de')
    expect(result.length).toBe(111)
  })

  it('does not mutate the source data', () => {
    const before = JSON.parse(JSON.stringify(quizData.questions))

    pickQuestionsByDifficulty('easy', 5)
    pickQuestionsByDifficulty('medium', 1000)
    pickQuestionsByDifficulty('impossible', 10)

    expect(quizData.questions).toEqual(before)
  })
})

describe('data validation on module load (DEV)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('emits no warnings because the real data is valid (both banks)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await import('./questions.js')

    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
