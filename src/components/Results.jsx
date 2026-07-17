function getMessage(score, total) {
  const ratio = total > 0 ? score / total : 0
  if (ratio >= 0.9)
    return { emoji: '🌟', text: 'Excellent ! Tu connais très bien ce livre !' }
  if (ratio >= 0.7)
    return {
      emoji: '👏',
      text: 'Très bien ! Encore un petit effort pour la perfection.',
    }
  if (ratio >= 0.5) return { emoji: '💪', text: 'Pas mal, continue comme ça !' }
  return { emoji: '📖', text: 'Continue à lire la Bible, tu vas progresser !' }
}

export default function Results({
  book,
  score,
  total,
  onReplay,
  onChangeBook,
  onShowHistory,
}) {
  const { emoji, text } = getMessage(score, total)
  const percent = total > 0 ? Math.round((score / total) * 100) : 0

  return (
    <div className="screen results">
      <div className="results-card">
        <span className="results-emoji" aria-hidden="true">
          {emoji}
        </span>
        <h2>Quiz terminé !</h2>
        <p className="results-book">{book}</p>
        <p className="results-score">
          {score} / {total}
        </p>
        <p className="results-percent">{percent}% de bonnes réponses</p>
        <p className="results-message">{text}</p>
        <div className="results-actions">
          <button className="btn-primary" onClick={onReplay}>
            <span aria-hidden="true">🔄</span> Rejouer ce livre
          </button>
          <button className="btn-secondary" onClick={onChangeBook}>
            <span aria-hidden="true">📚</span> Choisir un autre livre
          </button>
          {onShowHistory && (
            <button className="btn-link" onClick={onShowHistory}>
              <span aria-hidden="true">📊</span> Mon historique
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
