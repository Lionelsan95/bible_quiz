import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getBooks } from '../data/questions.js'
import LanguageToggle from './LanguageToggle.jsx'

export default function BookSelect({ onSelect, onShowHistory }) {
  const { t, i18n } = useTranslation()
  // The book list is language-specific; recompute only when the language changes.
  const books = useMemo(() => getBooks(i18n.language), [i18n.language])
  // Book chosen but awaiting a level pick; null shows the grid.
  const [pendingBook, setPendingBook] = useState(null)
  // Tracks the language `pendingBook` was set under, so a change can be
  // detected and cleared during render (React's recommended "adjusting state
  // when a prop changes" pattern) rather than via a useEffect + setState,
  // which would cost an extra render pass.
  const [pendingBookLanguage, setPendingBookLanguage] = useState(i18n.language)

  // A book's `levels` breakdown only exists for the language it was computed
  // in, and LanguageToggle stays reachable while a level is pending (it lives
  // in the always-rendered header). Reset rather than carry a book string that
  // no longer matches any entry in the freshly recomputed `books` list.
  if (pendingBookLanguage !== i18n.language) {
    setPendingBookLanguage(i18n.language)
    setPendingBook(null)
  }

  const pending = pendingBook
    ? books.find((b) => b.book === pendingBook)
    : null

  if (pending) {
    return (
      <div className="screen">
        <header className="home-header">
          <LanguageToggle />
          <h1>{t('level.choose', { book: pending.book })}</h1>
        </header>
        <div
          className="level-picker"
          role="group"
          aria-label={t('level.label')}
        >
          {pending.levels.map(({ level, count }) => {
            const disabled = count === 0
            const label = disabled
              ? `${t(`level.${level}`)} — ${t('level.unavailable')}`
              : t(`level.${level}`)
            return (
              <button
                key={level}
                type="button"
                className={`level-btn${disabled ? ' unavailable' : ''}`}
                aria-disabled={disabled || undefined}
                aria-label={label}
                title={label}
                onClick={() => {
                  if (disabled) return
                  onSelect(pending.book, level)
                }}
              >
                <span className="level-name">{t(`level.${level}`)}</span>
                <span className="level-count">
                  {t('book.count', { count })}
                </span>
              </button>
            )
          })}
        </div>
        <button className="btn-link" onClick={() => setPendingBook(null)}>
          {t('level.back')}
        </button>
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="home-header">
        <LanguageToggle />
        <h1>
          <span aria-hidden="true">📖</span> {t('home.title')}
        </h1>
        <p className="subtitle">{t('home.subtitle')}</p>
        {onShowHistory && (
          <button className="btn-link" onClick={onShowHistory}>
            <span aria-hidden="true">📊</span> {t('common.history')}
          </button>
        )}
      </header>
      <div className="book-grid">
        {books.map(({ book, count }) => (
          <button
            key={book}
            className="book-card"
            onClick={() => setPendingBook(book)}
          >
            <span className="book-name">{book}</span>
            <span className="book-count">{t('book.count', { count })}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
