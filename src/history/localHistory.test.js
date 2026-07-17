import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveAttempt, listAttempts } from './localHistory.js'

const STORAGE_KEY = 'quiz-biblique.attempts.v1'

beforeEach(() => {
  localStorage.clear()
})

describe('saveAttempt + listAttempts', () => {
  it('sauvegarde une tentative puis la retrouve via listAttempts', () => {
    saveAttempt({ livre: 'Genèse', score: 8, total: 10 })

    const attempts = listAttempts()

    expect(attempts.length).toBe(1)
    expect(attempts[0]).toMatchObject({ livre: 'Genèse', score: 8, total: 10 })
  })

  it('remplit automatiquement id et completedAt', () => {
    const record = saveAttempt({ livre: 'Genèse', score: 8, total: 10 })

    expect(typeof record.id).toBe('string')
    expect(record.id.length).toBeGreaterThan(0)
    expect(typeof record.completedAt).toBe('string')
    expect(Number.isNaN(new Date(record.completedAt).getTime())).toBe(false)
  })

  it('retourne les tentatives des plus récentes aux plus anciennes', () => {
    saveAttempt({ livre: 'Genèse', score: 1, total: 10 })
    saveAttempt({ livre: 'Exode', score: 2, total: 10 })
    saveAttempt({ livre: 'Lévitique', score: 3, total: 10 })

    const attempts = listAttempts()

    expect(attempts.map((a) => a.livre)).toEqual(['Lévitique', 'Exode', 'Genèse'])
  })

  it('plafonne le nombre de tentatives conservées à 100', () => {
    for (let i = 0; i < 105; i += 1) {
      saveAttempt({ livre: `Livre ${i}`, score: 1, total: 10 })
    }

    const attempts = listAttempts()

    expect(attempts.length).toBe(100)
    // La plus récente (dernière sauvegardée) reste en tête.
    expect(attempts[0].livre).toBe('Livre 104')
    // Les plus anciennes ont été évincées par le plafond.
    expect(attempts.some((a) => a.livre === 'Livre 0')).toBe(false)
  })
})

describe('listAttempts - tolérance aux données corrompues', () => {
  it('retourne un tableau vide si le JSON stocké est corrompu', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json {{{')

    expect(listAttempts()).toEqual([])
  })

  it('retourne un tableau vide si la valeur stockée n\'est pas un tableau', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }))

    expect(listAttempts()).toEqual([])
  })

  it('filtre les éléments null ou aux champs manquants/mal typés', () => {
    const stored = [
      { id: 'a', livre: 'Genèse', score: 5, total: 10 },
      null,
      { id: 'b', livre: 'Exode' }, // score/total manquants
      { id: 'c', livre: 'Lévitique', score: '5', total: 10 }, // score mal typé
      { livre: 'Nombres', score: 3, total: 10 }, // id manquant
      { id: 'd', livre: 'Deutéronome', score: 7, total: 10 },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const attempts = listAttempts()

    expect(attempts.map((a) => a.id)).toEqual(['a', 'd'])
  })
})

describe('saveAttempt - résilience au stockage', () => {
  it('avale les erreurs de stockage sans planter (quota dépassé / mode privé)', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

    expect(() => saveAttempt({ livre: 'Genèse', score: 5, total: 10 })).not.toThrow()

    setItemSpy.mockRestore()
  })

  it('retourne quand même l\'enregistrement construit même si le stockage échoue', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

    const record = saveAttempt({ livre: 'Genèse', score: 5, total: 10 })

    expect(record).toMatchObject({ livre: 'Genèse', score: 5, total: 10 })

    setItemSpy.mockRestore()
  })
})
