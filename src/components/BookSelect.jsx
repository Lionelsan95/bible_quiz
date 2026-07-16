import { getBooks } from '../data/questions.js'

const books = getBooks()

export default function BookSelect({ onSelect }) {
  return (
    <div className="screen">
      <header className="home-header">
        <h1>📖 Quiz Biblique</h1>
        <p className="subtitle">
          Choisis un livre de la Bible et réponds à 10 questions pour tester tes
          connaissances !
        </p>
      </header>
      <div className="book-grid">
        {books.map(({ livre, count }) => (
          <button
            key={livre}
            className="book-card"
            onClick={() => onSelect(livre)}
          >
            <span className="book-name">{livre}</span>
            <span className="book-count">
              {count} question{count > 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
