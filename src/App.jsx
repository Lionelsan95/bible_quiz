import { useState } from 'react'
import BookSelect from './components/BookSelect.jsx'
import Quiz from './components/Quiz.jsx'
import Results from './components/Results.jsx'
import HistoryScreen from './components/HistoryScreen.jsx'
import { pickQuestions } from './data/questions.js'
import { saveAttempt } from './history/historyStore.js'

const SCREENS = {
  HOME: 'home',
  QUIZ: 'quiz',
  RESULTS: 'results',
  HISTORY: 'history',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.HOME)
  const [selectedBook, setSelectedBook] = useState(null)
  const [questions, setQuestions] = useState([])
  const [score, setScore] = useState(0)

  function startGame(book) {
    setSelectedBook(book)
    setQuestions(pickQuestions(book, 10))
    setScore(0)
    setScreen(SCREENS.QUIZ)
  }

  function finishGame(finalScore) {
    setScore(finalScore)
    // Record the attempt for the history screen. Fire-and-forget: a failed save
    // must never block showing the results.
    saveAttempt({
      book: selectedBook,
      score: finalScore,
      total: questions.length,
    }).catch(() => {})
    setScreen(SCREENS.RESULTS)
  }

  return (
    <div className="app">
      {screen === SCREENS.HOME && (
        <BookSelect
          onSelect={startGame}
          onShowHistory={() => setScreen(SCREENS.HISTORY)}
        />
      )}
      {screen === SCREENS.QUIZ && (
        <Quiz
          book={selectedBook}
          questions={questions}
          onFinish={finishGame}
          onQuit={() => setScreen(SCREENS.HOME)}
        />
      )}
      {screen === SCREENS.RESULTS && (
        <Results
          book={selectedBook}
          score={score}
          total={questions.length}
          onReplay={() => startGame(selectedBook)}
          onChangeBook={() => setScreen(SCREENS.HOME)}
          onShowHistory={() => setScreen(SCREENS.HISTORY)}
        />
      )}
      {screen === SCREENS.HISTORY && (
        <HistoryScreen onBack={() => setScreen(SCREENS.HOME)} />
      )}
    </div>
  )
}
