import { useTranslation } from 'react-i18next'

// Returns the decorative emoji plus the translation key for the score message.
function getMessage(score, total) {
  const ratio = total > 0 ? score / total : 0
  if (ratio >= 0.9) return { emoji: '🌟', key: 'results.messageExcellent' }
  if (ratio >= 0.7) return { emoji: '👏', key: 'results.messageGood' }
  if (ratio >= 0.5) return { emoji: '💪', key: 'results.messageOk' }
  return { emoji: '📖', key: 'results.messageKeep' }
}

export default function Results({
  book,
  score,
  total,
  onReplay,
  onChangeBook,
  onShowHistory,
}) {
  const { t } = useTranslation()
  const { emoji, key } = getMessage(score, total)
  const percent = total > 0 ? Math.round((score / total) * 100) : 0

  return (
    <div className="screen results">
      <div className="results-card">
        <span className="results-emoji" aria-hidden="true">
          {emoji}
        </span>
        <h2>{t('results.title')}</h2>
        <p className="results-book">{book}</p>
        <p className="results-score">
          {score} / {total}
        </p>
        <p className="results-percent">{t('results.percent', { percent })}</p>
        <p className="results-message">{t(key)}</p>
        <div className="results-actions">
          <button className="btn-primary" onClick={onReplay}>
            <span aria-hidden="true">🔄</span> {t('results.replay')}
          </button>
          <button className="btn-secondary" onClick={onChangeBook}>
            <span aria-hidden="true">📚</span> {t('results.changeBook')}
          </button>
          {onShowHistory && (
            <button className="btn-link" onClick={onShowHistory}>
              <span aria-hidden="true">📊</span> {t('common.history')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
