import { describe, it, expect, afterEach } from 'vitest'
import i18n from './index.js'
import fr from './locales/fr/translation.json'
import en from './locales/en/translation.json'

// Flattens a nested translation object into sorted dot-path keys, e.g.
// { home: { title: 'x' } } -> ['home.title'].
function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value, path)
    }
    return [path]
  })
}

describe('i18n catalogs', () => {
  it('fr and en expose the exact same set of nested keys', () => {
    const frKeys = flattenKeys(fr).sort()
    const enKeys = flattenKeys(en).sort()

    expect(enKeys).toEqual(frKeys)
  })

  it('both catalogs define the book.count plural forms', () => {
    const frKeys = flattenKeys(fr)
    const enKeys = flattenKeys(en)

    expect(frKeys).toContain('book.count_one')
    expect(frKeys).toContain('book.count_other')
    expect(enKeys).toContain('book.count_one')
    expect(enKeys).toContain('book.count_other')
  })

  describe('book.count pluralization', () => {
    afterEach(async () => {
      await i18n.changeLanguage('fr')
    })

    it('renders the plural form for a count of 0 in fr and en', async () => {
      await i18n.changeLanguage('fr')
      expect(i18n.t('book.count', { count: 0 })).toBe('0 question')

      await i18n.changeLanguage('en')
      expect(i18n.t('book.count', { count: 0 })).toBe('0 questions')
    })

    it('renders the singular form for a count of 1 in fr and en', async () => {
      await i18n.changeLanguage('fr')
      expect(i18n.t('book.count', { count: 1 })).toBe('1 question')

      await i18n.changeLanguage('en')
      expect(i18n.t('book.count', { count: 1 })).toBe('1 question')
    })
  })
})
