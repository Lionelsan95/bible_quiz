import { useEffect, useState } from 'react'
import { listAttempts } from '../history/historyStore.js'

// French locale date formatting per project convention (French UI strings).
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
})

function formatDate(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

export default function HistoryScreen({ onBack }) {
  // null = still loading; array = loaded (possibly empty).
  const [attempts, setAttempts] = useState(null)

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
        ← Retour
      </button>
      <h2 className="history-title">
        <span aria-hidden="true">📊</span> Mon historique
      </h2>

      {attempts === null && <p className="history-status">Chargement…</p>}

      {attempts !== null && attempts.length === 0 && (
        <p className="history-empty">
          Aucune partie enregistrée pour le moment. Termine un quiz pour le voir
          apparaître ici !
        </p>
      )}

      {attempts !== null && attempts.length > 0 && (
        <ul className="history-list">
          {attempts.map((attempt) => (
            <li key={attempt.id} className="history-item">
              <div className="history-item-main">
                <span className="history-book">{attempt.livre}</span>
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
