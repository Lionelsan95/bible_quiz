import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getDifficulties } from '../data/questions.js'
import { QUESTION_COUNTS } from '../data/difficulties.js'

// Setup screen for a difficulty quiz: pick a level, pick how many questions.
//
// Deliberately renders no LanguageToggle — that control stays home-only so a
// configured-but-not-yet-started quiz can never be re-drawn against a language
// whose pool differs (see LanguageToggle's own comment).
export default function DifficultySetup({ onStart, onBack }) {
  const { t, i18n } = useTranslation()
  // Counts are language-specific in principle; recompute only on language change.
  const levels = useMemo(() => getDifficulties(i18n.language), [i18n.language])
  // getDifficulties reports every canonical level, including any with no
  // questions, so start on one that can actually be played.
  const [difficulty, setDifficulty] = useState(
    () => (levels.find((l) => l.count > 0) ?? levels[0]).difficulty,
  )
  const [count, setCount] = useState(10)

  return (
    <div className="screen difficulty-setup">
      <button className="btn-quit" onClick={onBack}>
        {t('difficulty.back')}
      </button>
      <header className="home-header">
        <h1>
          <span aria-hidden="true">🎯</span> {t('difficulty.title')}
        </h1>
        <p className="subtitle">{t('difficulty.subtitle')}</p>
      </header>

      <fieldset className="setup-group">
        <legend className="setup-legend">{t('difficulty.chooseLevel')}</legend>
        <div className="setup-options">
          {levels.map((level) => {
            // An empty level can't start a quiz, so it is marked unavailable
            // rather than silently doing nothing on start. aria-disabled (not
            // the native attribute) keeps it focusable — the project-wide
            // contract for option-style controls.
            const empty = level.count === 0
            return (
              <button
                key={level.difficulty}
                type="button"
                className={`setup-option level-option${
                  level.difficulty === difficulty ? ' active' : ''
                }`}
                aria-pressed={level.difficulty === difficulty}
                aria-disabled={empty || undefined}
                onClick={() => {
                  if (!empty) setDifficulty(level.difficulty)
                }}
              >
                <span className="setup-option-label">
                  {t(`difficulty.${level.difficulty}`)}
                </span>
                <span className="setup-option-count">
                  {t('book.count', { count: level.count })}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="setup-group">
        <legend className="setup-legend">{t('difficulty.chooseCount')}</legend>
        <div className="setup-options">
          {QUESTION_COUNTS.map((option) => (
            <button
              key={option}
              type="button"
              className={`setup-option count-option${
                option === count ? ' active' : ''
              }`}
              aria-pressed={option === count}
              onClick={() => setCount(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        className="btn-primary btn-start"
        onClick={() => onStart(difficulty, count)}
      >
        <span aria-hidden="true">▶️</span> {t('difficulty.start')}
      </button>
    </div>
  )
}
