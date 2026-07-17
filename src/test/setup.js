import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import i18n from '../i18n/index.js'

// The i18n singleton leaks state across test files/cases (i18next has no
// per-render instance here, unlike a React context provider): reset the
// language back to the app default after every test so a toggle test never
// bleeds 'en' into an unrelated test that expects French.
afterEach(async () => {
  await i18n.changeLanguage('fr')
  localStorage.removeItem('quiz-biblique.lang')
})
