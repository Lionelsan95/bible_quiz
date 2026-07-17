import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { BOOK_NAMES_FR_TO_EN } from './bookNames.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frJsonPath = resolve(__dirname, '../../data/quiz_biblique.json')
const enJsonPath = resolve(__dirname, '../../data/quiz_biblique.en.json')

// The English bank is currently a SAMPLE (Genesis only, 4 questions): these
// tests only check that the sample questions that DO exist are faithful
// translations of their French counterpart (same id, same option count, same
// correct-answer indices, matching book name). They intentionally do NOT
// require every French question to have an English counterpart yet.
describe('English bank sample-level parity with the French source', () => {
  const frRaw = JSON.parse(readFileSync(frJsonPath, 'utf-8'))
  const enRaw = JSON.parse(readFileSync(enJsonPath, 'utf-8'))
  const frById = new Map(frRaw.questions.map((q) => [q.id, q]))

  it('every English sample question id exists in the French source', () => {
    for (const enQ of enRaw.questions) {
      expect(frById.has(enQ.id)).toBe(true)
    }
  })

  it('option count matches the French counterpart for each sample question', () => {
    for (const enQ of enRaw.questions) {
      const frQ = frById.get(enQ.id)
      expect(enQ.options.length).toBe(frQ.options.length)
    }
  })

  it('correct-answer indices match the French counterpart (order-insensitive)', () => {
    for (const enQ of enRaw.questions) {
      const frQ = frById.get(enQ.id)
      const enSorted = [...enQ.correctAnswers].sort((a, b) => a - b)
      const frSorted = [...frQ.reponses_correctes].sort((a, b) => a - b)
      expect(enSorted).toEqual(frSorted)
    }
  })

  it('the book name matches the mapped English name of the French book', () => {
    for (const enQ of enRaw.questions) {
      const frQ = frById.get(enQ.id)
      expect(enQ.book).toBe(BOOK_NAMES_FR_TO_EN[frQ.livre])
    }
  })

  // Full parity — every French question id has an English counterpart — is
  // deferred until the full English bank (a later, review-gated deliverable)
  // replaces this Genesis-only sample.
  it.todo('every French question id has an English counterpart (full bank)')
})
