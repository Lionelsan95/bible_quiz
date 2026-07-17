import { describe, it, expect, vi } from 'vitest'
import { setSystemColorScheme } from '../test/matchMedia.js'
import {
  THEMES,
  DEFAULT_THEME,
  getStoredTheme,
  resolveTheme,
  applyTheme,
  getTheme,
  setTheme,
} from './theme.js'

// Duplicated on purpose: the key is a private module constant (not exported),
// and the test contract is "this literal string is what's read from/written
// to localStorage", matching how src/i18n/index.js's tests treat its own key.
const THEME_STORAGE_KEY = 'quiz-biblique.theme'

describe('getStoredTheme', () => {
  it('returns DEFAULT_THEME when nothing is stored', () => {
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(getStoredTheme()).toBe(DEFAULT_THEME)
  })

  it('returns DEFAULT_THEME when the stored value is not a valid theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(getStoredTheme()).toBe(DEFAULT_THEME)
  })

  it('returns the stored value when it is a valid theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(getStoredTheme()).toBe('dark')
  })
})

describe('resolveTheme', () => {
  it("resolves 'auto' to 'dark' when the system prefers dark", () => {
    setSystemColorScheme(true)
    expect(resolveTheme('auto')).toBe('dark')
  })

  it("resolves 'auto' to 'light' when the system prefers light", () => {
    setSystemColorScheme(false)
    expect(resolveTheme('auto')).toBe('light')
  })

  it('returns explicit prefs unchanged, regardless of the system scheme', () => {
    setSystemColorScheme(true)
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
  })
})

describe('applyTheme', () => {
  it('sets document.documentElement[data-theme] to the resolved value', () => {
    applyTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('resolves auto against the system scheme', () => {
    setSystemColorScheme(true)
    applyTheme('auto')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('does not write to localStorage', () => {
    applyTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })
})

describe('setTheme', () => {
  it('persists the pref to localStorage and applies data-theme', () => {
    setTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(getTheme()).toBe('dark')
  })

  it('ignores values outside THEMES, leaving pref/storage/DOM untouched', () => {
    setTheme('light')
    expect(THEMES).not.toContain('sepia')

    setTheme('sepia')

    expect(getTheme()).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('swallows storage errors and still applies the theme in-memory', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded')
      })

    expect(() => setTheme('dark')).not.toThrow()
    expect(getTheme()).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    setItemSpy.mockRestore()
  })
})

describe('auto follows the OS live', () => {
  it("re-applies the resolved theme when the OS scheme changes while pref is 'auto'", () => {
    setSystemColorScheme(false)
    setTheme('auto')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    setSystemColorScheme(true)

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('does not react to OS changes once an explicit pref is set', () => {
    setSystemColorScheme(false)
    setTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    setSystemColorScheme(true)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})

describe('module init', () => {
  // The OS listener and the initial applyTheme() call both run once, at
  // import time. Testing that requires a genuinely fresh module instance:
  // vi.resetModules() clears the import cache so the next dynamic import
  // re-runs theme.js's top-level init code from scratch.
  it('applies the stored preference to the DOM as soon as the module loads, resolving auto against the live system scheme', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'auto')
    document.documentElement.removeAttribute('data-theme')
    setSystemColorScheme(true)

    vi.resetModules()
    const fresh = await import('./theme.js')

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(fresh.getTheme()).toBe('auto')

    // Cleanup: this fresh module instance registered its own OS-change
    // listener (on the shared matchMedia stub) that we have no handle to
    // remove. Left at 'auto' it would keep reacting to setSystemColorScheme
    // calls made by later tests in this file via the *original* module
    // import above, potentially flipping data-theme behind their back.
    // Moving it off 'auto' permanently disarms its guard.
    fresh.setTheme('dark')
  })
})
