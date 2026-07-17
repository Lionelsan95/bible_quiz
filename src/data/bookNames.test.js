import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { BOOK_NAMES_FR_TO_EN } from './bookNames.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rawJsonPath = resolve(__dirname, '../../data/quiz_biblique.json')

describe('BOOK_NAMES_FR_TO_EN', () => {
  it('has an English name for every distinct French book in the dataset', () => {
    const raw = JSON.parse(readFileSync(rawJsonPath, 'utf-8'))
    const distinctBooks = [...new Set(raw.questions.map((q) => q.livre))]

    for (const book of distinctBooks) {
      expect(BOOK_NAMES_FR_TO_EN).toHaveProperty(book)
      expect(typeof BOOK_NAMES_FR_TO_EN[book]).toBe('string')
      expect(BOOK_NAMES_FR_TO_EN[book].length).toBeGreaterThan(0)
    }
  })
})
