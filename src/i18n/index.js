import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr/translation.json'
import en from './locales/en/translation.json'

export const SUPPORTED_LANGUAGES = ['fr', 'en']
export const DEFAULT_LANGUAGE = 'fr'
const LANG_STORAGE_KEY = 'quiz-biblique.lang'

// Read the persisted language, tolerating unavailable/blocked storage
// (private browsing) the same way the history store does.
function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY)
    return SUPPORTED_LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

function applyHtmlLang(lng) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', lng)
  }
}

function applyDocumentTitle() {
  if (typeof document !== 'undefined') {
    document.title = i18n.t('home.title')
  }
}

// Synchronous init: resources are bundled (no backend plugin), so init completes
// before the first render — the stored language is applied with no flash, and
// useSuspense is off so no Suspense boundary is ever required.
i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: readStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

// Persist the choice and keep <html lang> and the tab title in sync on change.
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng)
  } catch {
    // Storage unavailable — language still applies for this session.
  }
  applyHtmlLang(lng)
  applyDocumentTitle()
})

applyHtmlLang(i18n.language)
applyDocumentTitle()

export default i18n
