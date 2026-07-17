import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { installMatchMedia, setSystemColorScheme } from './matchMedia.js'
import i18n from '../i18n/index.js'

// jsdom lacks window.matchMedia — install the stub as a top-level statement
// BEFORE any module that reads it at import time. Do NOT statically import
// ../theme/theme.js here: static imports hoist above this line, so the theme
// module would evaluate before the stub exists.
installMatchMedia()

afterEach(async () => {
  // The i18n singleton leaks state across test files/cases (i18next has no
  // per-render instance here, unlike a React context provider): reset the
  // language back to the app default after every test so a toggle test never
  // bleeds 'en' into an unrelated test that expects French.
  await i18n.changeLanguage('fr')
  localStorage.removeItem('quiz-biblique.lang')

  // The theme store is likewise a singleton — reset it to the default and a
  // light OS so a dark-mode test can't bleed into the next. Leaves data-theme
  // at the resolved 'light' (the module's invariant), not removed.
  setSystemColorScheme(false)
  const { DEFAULT_THEME, setTheme } = await import('../theme/theme.js')
  setTheme(DEFAULT_THEME)
  localStorage.removeItem('quiz-biblique.theme')
})
