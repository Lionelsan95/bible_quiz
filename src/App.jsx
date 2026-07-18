import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BookSelect from './components/BookSelect.jsx'
import Quiz from './components/Quiz.jsx'
import Results from './components/Results.jsx'
import HistoryScreen from './components/HistoryScreen.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { pickQuestions } from './data/questions.js'
import { saveAttempt } from './history/historyStore.js'

const SCREENS = {
  HOME: 'home',
  QUIZ: 'quiz',
  RESULTS: 'results',
  HISTORY: 'history',
}

export default function App() {
  const { i18n } = useTranslation()
  const [screen, setScreen] = useState(SCREENS.HOME)
  const [selectedBook, setSelectedBook] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [questions, setQuestions] = useState([])
  const [score, setScore] = useState(0)

  function startGame(book, level) {
    const picked = pickQuestions(book, 10, { lang: i18n.language, level })
    // Guard: a book/level combo with no questions in the active language does
    // nothing rather than entering a blank quiz (the caller's screen is left
    // as-is). The home-only LanguageToggle and BookSelect's own disabling of
    // 0-count levels make this unreachable in practice; it also defends the
    // replay path from RESULTS.
    if (picked.length === 0) return
    setSelectedBook(book)
    setSelectedLevel(level)
    setQuestions(picked)
    setScore(0)
    setScreen(SCREENS.QUIZ)
  }

  function finishGame(finalScore) {
    setScore(finalScore)
    // Record the attempt for the history screen. Fire-and-forget: a failed save
    // must never block showing the results.
    saveAttempt({
      book: selectedBook,
      level: selectedLevel,
      score: finalScore,
      total: questions.length,
    }).catch(() => {})
    setScreen(SCREENS.RESULTS)
  }

  return (
    <div className="app">
      <div className="app-toolbar">
        <ThemeToggle />
      </div>
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
          onReplay={() => startGame(selectedBook, selectedLevel)}
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
