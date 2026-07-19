import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getBooks } from '../data/questions.js'
import LanguageToggle from './LanguageToggle.jsx'

export default function BookSelect({
  onSelect,
  onPlayByDifficulty,
  onShowHistory,
}) {
  const { t, i18n } = useTranslation()
  // The book list is language-specific; recompute only when the language changes.
  const books = useMemo(() => getBooks(i18n.language), [i18n.language])

  return (
    <div className="screen">
      <header className="home-header">
        <LanguageToggle />
        <h1>
          <span aria-hidden="true">📖</span> {t('home.title')}
        </h1>
        <p className="subtitle">{t('home.subtitle')}</p>
        <div className="home-actions">
          {onPlayByDifficulty && (
            <button className="btn-secondary" onClick={onPlayByDifficulty}>
              <span aria-hidden="true">🎯</span> {t('home.playByDifficulty')}
            </button>
          )}
          {onShowHistory && (
            <button className="btn-link" onClick={onShowHistory}>
              <span aria-hidden="true">📊</span> {t('common.history')}
            </button>
          )}
        </div>
      </header>
      <div className="book-grid">
        {books.map(({ book, count }) => (
          <button
            key={book}
            className="book-card"
            onClick={() => onSelect(book)}
          >
            <span className="book-name">{book}</span>
            <span className="book-count">{t('book.count', { count })}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
