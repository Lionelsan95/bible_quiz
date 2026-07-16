import { useState } from 'react'
import BookSelect from './components/BookSelect.jsx'
import Quiz from './components/Quiz.jsx'
import Results from './components/Results.jsx'
import { pickQuestions } from './data/questions.js'

const SCREENS = {
  HOME: 'accueil',
  QUIZ: 'quiz',
  RESULTS: 'resultats',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.HOME)
  const [selectedBook, setSelectedBook] = useState(null)
  const [questions, setQuestions] = useState([])
  const [score, setScore] = useState(0)

  function startGame(livre) {
    setSelectedBook(livre)
    setQuestions(pickQuestions(livre, 10))
    setScore(0)
    setScreen(SCREENS.QUIZ)
  }

  function finishGame(finalScore) {
    setScore(finalScore)
    setScreen(SCREENS.RESULTS)
  }

  return (
    <div className="app">
      {screen === SCREENS.HOME && <BookSelect onSelect={startGame} />}
      {screen === SCREENS.QUIZ && (
        <Quiz
          livre={selectedBook}
          questions={questions}
          onFinish={finishGame}
          onQuit={() => setScreen(SCREENS.HOME)}
        />
      )}
      {screen === SCREENS.RESULTS && (
        <Results
          livre={selectedBook}
          score={score}
          total={questions.length}
          onReplay={() => startGame(selectedBook)}
          onChangeBook={() => setScreen(SCREENS.HOME)}
        />
      )}
    </div>
  )
}
