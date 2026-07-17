import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n/index.js'

// Rendered ONLY on the home screen. This placement is a load-bearing invariant:
// language can only change from HOME, so an in-progress quiz (or a replay) can
// never re-pick a book that has no questions in the newly selected language.
export default function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? i18n.language

  return (
    <div
      className="language-toggle"
      role="group"
      aria-label={t('language.label')}
    >
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          lang={lng}
          className={`lang-btn${lng === current ? ' active' : ''}`}
          aria-pressed={lng === current}
          aria-label={t(`language.${lng}Full`)}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {t(`language.${lng}`)}
        </button>
      ))}
    </div>
  )
}
