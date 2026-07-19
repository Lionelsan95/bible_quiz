import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveAttempt, listAttempts } from './localHistory.js'

const STORAGE_KEY = 'quiz-biblique.attempts.v2'
const LEGACY_KEY_V1 = 'quiz-biblique.attempts.v1'

beforeEach(() => {
  localStorage.clear()
})

describe('saveAttempt + listAttempts', () => {
  it('saves an attempt and retrieves it via listAttempts', () => {
    saveAttempt({ book: 'Genèse', score: 8, total: 10 })

    const attempts = listAttempts()

    expect(attempts.length).toBe(1)
    expect(attempts[0]).toMatchObject({ book: 'Genèse', score: 8, total: 10 })
  })

  it('automatically fills in id and completedAt', () => {
    const record = saveAttempt({ book: 'Genèse', score: 8, total: 10 })

    expect(typeof record.id).toBe('string')
    expect(record.id.length).toBeGreaterThan(0)
    expect(typeof record.completedAt).toBe('string')
    expect(Number.isNaN(new Date(record.completedAt).getTime())).toBe(false)
  })

  it('returns attempts from most recent to oldest', () => {
    saveAttempt({ book: 'Genèse', score: 1, total: 10 })
    saveAttempt({ book: 'Exode', score: 2, total: 10 })
    saveAttempt({ book: 'Lévitique', score: 3, total: 10 })

    const attempts = listAttempts()

    expect(attempts.map((a) => a.book)).toEqual([
      'Lévitique',
      'Exode',
      'Genèse',
    ])
  })

  it('caps the number of retained attempts at 100', () => {
    for (let i = 0; i < 105; i += 1) {
      saveAttempt({ book: `Livre ${i}`, score: 1, total: 10 })
    }

    const attempts = listAttempts()

    expect(attempts.length).toBe(100)
    // The most recent (last saved) stays at the front.
    expect(attempts[0].book).toBe('Livre 104')
    // The oldest have been evicted by the cap.
    expect(attempts.some((a) => a.book === 'Livre 0')).toBe(false)
  })
})

describe('difficulty-mode attempts', () => {
  it('saves and retrieves a difficulty attempt (no book)', () => {
    saveAttempt({
      mode: 'difficulty',
      difficulty: 'hard',
      score: 12,
      total: 20,
    })

    const attempts = listAttempts()

    expect(attempts.length).toBe(1)
    expect(attempts[0]).toMatchObject({
      mode: 'difficulty',
      difficulty: 'hard',
      score: 12,
      total: 20,
    })
  })

  it('does not store a book key on a difficulty attempt', () => {
    const record = saveAttempt({
      mode: 'difficulty',
      difficulty: 'easy',
      score: 3,
      total: 5,
    })

    expect('book' in record).toBe(false)
  })

  it("defaults mode to 'book' when the caller omits it", () => {
    const record = saveAttempt({ book: 'Genèse', score: 8, total: 10 })

    expect(record.mode).toBe('book')
    expect(record.book).toBe('Genèse')
    expect('difficulty' in record).toBe(false)
  })

  it('keeps both modes in one newest-first list', () => {
    saveAttempt({ book: 'Genèse', score: 8, total: 10 })
    saveAttempt({
      mode: 'difficulty',
      difficulty: 'medium',
      score: 9,
      total: 15,
    })

    const attempts = listAttempts()

    expect(attempts.map((a) => a.mode)).toEqual(['difficulty', 'book'])
  })

  // Records written before difficulty mode existed have no `mode` field. They
  // must keep validating on `book` alone, or upgrading would blank the history.
  it('still accepts legacy records that predate the mode field', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'legacy',
          book: 'Exode',
          score: 5,
          total: 10,
          completedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    )

    expect(listAttempts().map((a) => a.id)).toEqual(['legacy'])
  })

  it('filters out records identified by neither book nor difficulty', () => {
    const stored = [
      { id: 'a', book: 'Genèse', score: 5, total: 10 },
      // mode says difficulty but the level is missing
      { id: 'b', mode: 'difficulty', score: 5, total: 10 },
      // a difficulty value without the mode flag is not a valid identifier
      { id: 'c', difficulty: 'hard', score: 5, total: 10 },
      { id: 'd', mode: 'difficulty', difficulty: 'easy', score: 5, total: 10 },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    expect(listAttempts().map((a) => a.id)).toEqual(['a', 'd'])
  })
})

describe('listAttempts - tolerance to corrupt data', () => {
  it('returns an empty array if the stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json {{{')

    expect(listAttempts()).toEqual([])
  })

  it('returns an empty array if the stored value is not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }))

    expect(listAttempts()).toEqual([])
  })

  it('filters out null entries or entries with missing/mistyped fields', () => {
    const stored = [
      { id: 'a', book: 'Genèse', score: 5, total: 10 },
      null,
      { id: 'b', book: 'Exode' }, // missing score/total
      { id: 'c', book: 'Lévitique', score: '5', total: 10 }, // mistyped score
      { book: 'Nombres', score: 3, total: 10 }, // missing id
      { id: 'd', book: 'Deutéronome', score: 7, total: 10 },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const attempts = listAttempts()

    expect(attempts.map((a) => a.id)).toEqual(['a', 'd'])
  })
})

describe('saveAttempt - storage resilience', () => {
  it('swallows storage errors without crashing (quota exceeded / private mode)', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

    expect(() =>
      saveAttempt({ book: 'Genèse', score: 5, total: 10 }),
    ).not.toThrow()

    setItemSpy.mockRestore()
  })

  it('still returns the built record even when storage fails', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

    const record = saveAttempt({ book: 'Genèse', score: 5, total: 10 })

    expect(record).toMatchObject({ book: 'Genèse', score: 5, total: 10 })

    setItemSpy.mockRestore()
  })
})

describe('v1 -> v2 migration', () => {
  it('migrates valid v1 records (with `livre`) to v2, mapped to `book`, when v2 is absent', () => {
    const v1Data = [
      {
        id: 'a',
        livre: 'Genèse',
        score: 8,
        total: 10,
        completedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b',
        livre: 'Exode',
        score: 5,
        total: 10,
        completedAt: '2026-01-02T00:00:00.000Z',
      },
    ]
    localStorage.setItem(LEGACY_KEY_V1, JSON.stringify(v1Data))

    const attempts = listAttempts()

    expect(attempts).toEqual([
      {
        id: 'a',
        book: 'Genèse',
        score: 8,
        total: 10,
        completedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b',
        book: 'Exode',
        score: 5,
        total: 10,
        completedAt: '2026-01-02T00:00:00.000Z',
      },
    ])
    // The migration persisted the mapped data under the v2 key.
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('returns an empty array without throwing when v1 data is corrupt/non-array', () => {
    localStorage.setItem(LEGACY_KEY_V1, 'not valid json {{{')

    expect(() => listAttempts()).not.toThrow()
    expect(listAttempts()).toEqual([])

    localStorage.setItem(LEGACY_KEY_V1, JSON.stringify({ not: 'an array' }))

    expect(() => listAttempts()).not.toThrow()
    expect(listAttempts()).toEqual([])
  })

  it('marks migration done (writes v2) even when v1 has no valid records', () => {
    // v1 present but every record is invalid -> migrated result is empty, yet v2
    // must still be written so subsequent reads stop re-parsing v1.
    localStorage.setItem(
      LEGACY_KEY_V1,
      JSON.stringify([{ id: 'x' }, null, 'nope']),
    )

    expect(listAttempts()).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('ignores v1 data when v2 is already present (no merge)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'v2-a',
          book: 'Nombres',
          score: 3,
          total: 10,
          completedAt: '2026-02-01T00:00:00.000Z',
        },
      ]),
    )
    localStorage.setItem(
      LEGACY_KEY_V1,
      JSON.stringify([
        {
          id: 'v1-a',
          livre: 'Genèse',
          score: 8,
          total: 10,
          completedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    )

    const attempts = listAttempts()

    expect(attempts.map((a) => a.id)).toEqual(['v2-a'])
  })
})
