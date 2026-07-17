import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { getBooks, pickQuestions } from './questions.js'
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

  it('returns the English bank (sample: Genesis only) for lang="en"', () => {
    const books = getBooks('en')
    expect(books).toEqual([{ book: 'Genesis', count: 4 }])
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
    expect(result.length).toBe(4)
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
