import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listAttempts } from '../history/historyStore.js'

export default function HistoryScreen({ onBack }) {
  const { t, i18n } = useTranslation()
  // null = still loading; array = loaded (possibly empty).
  const [attempts, setAttempts] = useState(null)

  // Dates follow the active language (fr-FR, en, …). Rebuilt only on language
  // change — constructing an Intl.DateTimeFormat is comparatively expensive.
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    [i18n.language],
  )
  function formatDate(iso) {
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
  }

  useEffect(() => {
    let active = true
    listAttempts()
      .then((list) => {
        if (active) setAttempts(list)
      })
      .catch(() => {
        // Best-effort, mirroring localHistory: on failure show the empty state
        // rather than leaving the screen stuck on "Chargement…".
        if (active) setAttempts([])
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="screen history">
      <button className="btn-quit" onClick={onBack}>
        {t('history.back')}
      </button>
      <h2 className="history-title">
        <span aria-hidden="true">📊</span> {t('common.history')}
      </h2>

      {attempts === null && (
        <p className="history-status">{t('history.loading')}</p>
      )}

      {attempts !== null && attempts.length === 0 && (
        <p className="history-empty">{t('history.empty')}</p>
      )}

      {attempts !== null && attempts.length > 0 && (
        <ul className="history-list">
          {attempts.map((attempt) => (
            <li key={attempt.id} className="history-item">
              <div className="history-item-main">
                <span className="history-book">{attempt.book}</span>
                {attempt.level && (
                  <span className="history-level">
                    {t(`level.${attempt.level}`)}
                  </span>
                )}
                <span className="history-date">
                  {formatDate(attempt.completedAt)}
                </span>
              </div>
              <span className="history-score">
                {attempt.score} / {attempt.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
