import { useTranslation } from 'react-i18next'
import { getBooks } from '../data/questions.js'
import LanguageToggle from './LanguageToggle.jsx'

const books = getBooks()

export default function BookSelect({ onSelect, onShowHistory }) {
  const { t } = useTranslation()

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
