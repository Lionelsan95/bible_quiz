import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { BOOK_NAMES_FR_TO_EN } from './bookNames.js'
import { DIFFICULTY_FR_TO_CANONICAL } from './difficulties.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frJsonPath = resolve(__dirname, '../../data/quiz_biblique.json')
const enJsonPath = resolve(__dirname, '../../data/quiz_biblique.en.json')

// Full parity between the English bank and the French source: identical question
// ids, and each English question is a faithful structural translation of its
// French counterpart (same option count, same correct-answer indices, and a book
// name that matches the curated fr->en map). Guards against a translation that
// drops/adds a question, reorders or loses options, or misnames a book.
// (Uses the English bank's raw snake_case keys: question / correct_answers.)
describe('English bank parity with the French source', () => {
  const frRaw = JSON.parse(readFileSync(frJsonPath, 'utf-8'))
  const enRaw = JSON.parse(readFileSync(enJsonPath, 'utf-8'))
  const frById = new Map(frRaw.questions.map((q) => [q.id, q]))
  const enById = new Map(enRaw.questions.map((q) => [q.id, q]))

  it('has exactly the same set of question ids as the French source', () => {
    expect([...enById.keys()].sort()).toEqual([...frById.keys()].sort())
  })

  it('matches the French option count for every question', () => {
    for (const enQ of enRaw.questions) {
      expect(enQ.options.length).toBe(frById.get(enQ.id).options.length)
    }
  })

  it('matches the French correct-answer indices (order-insensitive)', () => {
    for (const enQ of enRaw.questions) {
      const frQ = frById.get(enQ.id)
      const enSorted = [...enQ.correct_answers].sort((a, b) => a - b)
      const frSorted = [...frQ.reponses_correctes].sort((a, b) => a - b)
      expect(enSorted).toEqual(frSorted)
    }
  })

  it('names each book with the mapped English name of the French book', () => {
    for (const enQ of enRaw.questions) {
      expect(enQ.book).toBe(BOOK_NAMES_FR_TO_EN[frById.get(enQ.id).livre])
    }
  })

  // Difficulty mode pools questions across all books by canonical difficulty, so
  // a level must contain the same questions in both languages — a single
  // mistranslated level would silently change what an English player is served.
  it('matches the mapped French difficulty for every question', () => {
    for (const enQ of enRaw.questions) {
      expect(enQ.difficulty).toBe(
        DIFFICULTY_FR_TO_CANONICAL[frById.get(enQ.id).difficulte],
      )
    }
  })
})
