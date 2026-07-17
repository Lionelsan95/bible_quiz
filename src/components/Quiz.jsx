import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import QuestionCard from './QuestionCard.jsx'

export default function Quiz({ book, questions, onFinish, onQuit }) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)

  const total = questions.length
  const question = questions[index]
  const isLast = index === total - 1

  // Defensive guard: avoid a crash if the question list is empty.
  if (!question) return null

  function handleAnswer(isCorrect) {
    if (isCorrect) setScore((s) => s + 1)
    setAnswered(true)
  }

  function handleNext() {
    if (isLast) {
      onFinish(score)
    } else {
      setIndex((i) => i + 1)
      setAnswered(false)
    }
  }

  return (
    <div className="screen">
      <header className="quiz-header">
        <button className="btn-quit" onClick={onQuit}>
          {t('quiz.quit')}
        </button>
        <div className="quiz-progress">
          <span className="quiz-book">{book}</span>
          <span className="quiz-count">
            {t('quiz.progress', { current: index + 1, total })}
          </span>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={t('quiz.progressAria', { current: index + 1, total })}
        >
          <div
            className="progress-fill"
            style={{
              width: `${((index + (answered ? 1 : 0)) / total) * 100}%`,
            }}
          />
        </div>
      </header>

      <QuestionCard
        key={question.id}
        question={question}
        onAnswer={handleAnswer}
      />

      {answered && (
        <button className="btn-primary btn-next" onClick={handleNext}>
          {isLast ? (
            <>
              {t('quiz.seeScore')} <span aria-hidden="true">🎉</span>
            </>
          ) : (
            t('quiz.next')
          )}
        </button>
      )}
    </div>
  )
}
