import { getBooks } from '../data/questions.js'

const books = getBooks()

export default function BookSelect({ onSelect, onShowHistory }) {
  return (
    <div className="screen">
      <header className="home-header">
        <h1>📖 Quiz Biblique</h1>
        <p className="subtitle">
          Choisis un livre de la Bible et réponds à 10 questions pour tester tes
          connaissances !
        </p>
        {onShowHistory && (
          <button className="btn-link" onClick={onShowHistory}>
            <span aria-hidden="true">📊</span> Mon historique
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
            <span className="book-count">
              {count} question{count > 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
