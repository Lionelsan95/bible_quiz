import { useTranslation } from 'react-i18next'
import { THEMES, useTheme } from '../theme/theme.js'

// Decorative icons per mode; the accessible name comes from the aria-label.
const ICONS = { light: '☀️', dark: '🌙', auto: '🌗' }

// Compact segmented control, mirroring LanguageToggle's a11y contract:
// role="group" + aria-label, per-button aria-pressed, never native `disabled`,
// decorative emoji in aria-hidden spans with a real (translated) aria-label.
export default function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-toggle" role="group" aria-label={t('theme.label')}>
      {THEMES.map((mode) => (
        <button
          key={mode}
          type="button"
          className={`theme-btn${mode === theme ? ' active' : ''}`}
          aria-pressed={mode === theme}
          aria-label={t(`theme.${mode}`)}
          title={t(`theme.${mode}`)}
          onClick={() => setTheme(mode)}
        >
          <span aria-hidden="true">{ICONS[mode]}</span>
        </button>
      ))}
    </div>
  )
}
