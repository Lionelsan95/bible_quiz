import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BookSelect from './components/BookSelect.jsx'
import DifficultySetup from './components/DifficultySetup.jsx'
import Quiz from './components/Quiz.jsx'
import Results from './components/Results.jsx'
import HistoryScreen from './components/HistoryScreen.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { pickQuestions, pickQuestionsByDifficulty } from './data/questions.js'
import { saveAttempt } from './history/historyStore.js'

const SCREENS = {
  HOME: 'home',
  DIFFICULTY: 'difficulty',
  QUIZ: 'quiz',
  RESULTS: 'results',
  HISTORY: 'history',
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [screen, setScreen] = useState(SCREENS.HOME)
  // What the current game was drawn from — a discriminated union, either
  // { mode: 'book', book } or { mode: 'difficulty', difficulty, count }. Kept
  // whole (rather than as loose fields) so replay can redraw from exactly the
  // same configuration.
  const [gameConfig, setGameConfig] = useState(null)
  const [questions, setQuestions] = useState([])
  const [score, setScore] = useState(0)

  function startGame(config) {
    const picked =
      config.mode === 'difficulty'
        ? pickQuestionsByDifficulty(
            config.difficulty,
            config.count,
            i18n.language,
          )
        : pickQuestions(config.book, 10, i18n.language)
    // Guard: an empty pool in the active language does nothing rather than
    // entering a blank quiz (the caller's screen is left as-is). The home-only
    // LanguageToggle makes this unreachable in practice; it also defends the
    // replay path from RESULTS.
    if (picked.length === 0) return
    setGameConfig(config)
    setQuestions(picked)
    setScore(0)
    setScreen(SCREENS.QUIZ)
  }

  function finishGame(finalScore) {
    setScore(finalScore)
    // Record the attempt for the history screen. Fire-and-forget: a failed save
    // must never block showing the results. The whole config is spread in, but
    // localHistory keeps only the mode-identifying field — so `count` is not
    // persisted, and a difficulty attempt can't be replayed from history.
    saveAttempt({
      ...gameConfig,
      score: finalScore,
      total: questions.length,
    }).catch(() => {})
    setScreen(SCREENS.RESULTS)
  }

  // What the current game is called on screen. Book names come from the data as
  // played; difficulty levels are canonical ids translated at render time.
  const gameLabel =
    gameConfig?.mode === 'difficulty'
      ? t(`difficulty.${gameConfig.difficulty}`)
      : gameConfig?.book

  return (
    <div className="app">
      <div className="app-toolbar">
        <ThemeToggle />
      </div>
      {screen === SCREENS.HOME && (
        <BookSelect
          onSelect={(book) => startGame({ mode: 'book', book })}
          onPlayByDifficulty={() => setScreen(SCREENS.DIFFICULTY)}
          onShowHistory={() => setScreen(SCREENS.HISTORY)}
        />
      )}
      {screen === SCREENS.DIFFICULTY && (
        <DifficultySetup
          onStart={(difficulty, count) =>
            startGame({ mode: 'difficulty', difficulty, count })
          }
          onBack={() => setScreen(SCREENS.HOME)}
        />
      )}
      {screen === SCREENS.QUIZ && (
        <Quiz
          label={gameLabel}
          questions={questions}
          onFinish={finishGame}
          onQuit={() => setScreen(SCREENS.HOME)}
        />
      )}
      {screen === SCREENS.RESULTS && (
        <Results
          label={gameLabel}
          mode={gameConfig?.mode}
          score={score}
          total={questions.length}
          onReplay={() => startGame(gameConfig)}
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
