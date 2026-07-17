import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { getBooks, pickQuestions } from './questions.js'
import quizData from '../../data/quiz_biblique.json'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rawJsonPath = resolve(__dirname, '../../data/quiz_biblique.json')

describe('getBooks', () => {
  it("préserve l'ordre biblique (ordre d'apparition dans le JSON)", () => {
    const raw = JSON.parse(readFileSync(rawJsonPath, 'utf-8'))
    const expectedOrder = []
    for (const q of raw.questions) {
      if (!expectedOrder.includes(q.livre)) expectedOrder.push(q.livre)
    }

    const books = getBooks()

    expect(books.map((b) => b.livre)).toEqual(expectedOrder)
  })

  it('calcule le bon nombre de questions par livre', () => {
    const raw = JSON.parse(readFileSync(rawJsonPath, 'utf-8'))
    const expectedCounts = new Map()
    for (const q of raw.questions) {
      expectedCounts.set(q.livre, (expectedCounts.get(q.livre) ?? 0) + 1)
    }

    const books = getBooks()

    expect(books.length).toBe(expectedCounts.size)
    for (const { livre, count } of books) {
      expect(count).toBe(expectedCounts.get(livre))
    }
  })

  it('trouve bien Genèse avec 40 questions (donnée de référence connue)', () => {
    const books = getBooks()
    const genese = books.find((b) => b.livre === 'Genèse')
    expect(genese).toEqual({ livre: 'Genèse', count: 40 })
  })
})

describe('pickQuestions', () => {
  it('retourne au maximum n questions', () => {
    const result = pickQuestions('Genèse', 5)
    expect(result.length).toBe(5)
  })

  it('ne retourne jamais plus de questions que celles disponibles pour le livre', () => {
    const result = pickQuestions('Genèse', 1000)
    expect(result.length).toBe(40)
  })

  it('retourne un tableau vide pour un livre inconnu', () => {
    const result = pickQuestions('Livre Inexistant', 10)
    expect(result).toEqual([])
  })

  it('ne retourne que des questions du bon livre', () => {
    const result = pickQuestions('Genèse', 40)
    expect(result.length).toBe(40)
    for (const q of result) {
      expect(q.livre).toBe('Genèse')
    }
  })

  it('mélange les options tout en remappant correctement les réponses correctes', () => {
    const raw = JSON.parse(readFileSync(rawJsonPath, 'utf-8'))
    const originalById = new Map(raw.questions.map((q) => [q.id, q]))

    const result = pickQuestions('Genèse', 40)
    expect(result.length).toBe(40)

    for (const q of result) {
      const original = originalById.get(q.id)
      expect(original).toBeDefined()

      // Le jeu d'options est préservé (même contenu, ordre potentiellement différent).
      expect([...q.options].sort()).toEqual([...original.options].sort())
      expect(q.options.length).toBe(original.options.length)

      // Les indices des bonnes réponses sont triés par ordre croissant.
      const sorted = [...q.reponses_correctes].sort((a, b) => a - b)
      expect(q.reponses_correctes).toEqual(sorted)

      // Le nombre de bonnes réponses est inchangé.
      expect(q.reponses_correctes.length).toBe(
        original.reponses_correctes.length,
      )

      // Les TEXTES des bonnes réponses sont préservés après le remappage des indices.
      const remappedCorrectTexts = q.reponses_correctes
        .map((i) => q.options[i])
        .sort()
      const originalCorrectTexts = original.reponses_correctes
        .map((i) => original.options[i])
        .sort()
      expect(remappedCorrectTexts).toEqual(originalCorrectTexts)
    }
  })

  it('ne mute pas les données source', () => {
    const before = JSON.parse(JSON.stringify(quizData.questions))

    // On tire plusieurs fois, y compris avec plus de questions que disponibles,
    // pour maximiser les chances de révéler une mutation en place.
    pickQuestions('Genèse', 5)
    pickQuestions('Genèse', 1000)
    pickQuestions('Exode', 35)
    pickQuestions('Livre Inexistant', 10)

    expect(quizData.questions).toEqual(before)
  })

  it('gère n=0 en retournant un tableau vide', () => {
    const result = pickQuestions('Genèse', 0)
    expect(result).toEqual([])
  })
})

describe('validation des données au chargement du module (DEV)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("n'émet aucun avertissement car les données réelles sont valides", async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await import('./questions.js')

    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
