import { useState } from 'react'

export default function QuestionCard({ question, onAnswer }) {
  const [selected, setSelected] = useState([])
  const [revealed, setRevealed] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const correct = question.reponses_correctes
  const isMulti = correct.length > 1

  function submit(selection) {
    const ok =
      selection.length === correct.length &&
      selection.every((i) => correct.includes(i))
    setSelected(selection)
    setRevealed(true)
    setIsCorrect(ok)
    onAnswer(ok)
  }

  function handleClick(i) {
    if (revealed) return
    if (!isMulti) {
      submit([i])
    } else {
      setSelected((prev) =>
        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
      )
    }
  }

  function optionClass(i) {
    let cls = 'option'
    if (!revealed) {
      if (selected.includes(i)) cls += ' selected'
    } else {
      if (correct.includes(i)) cls += ' correct'
      else if (selected.includes(i)) cls += ' wrong'
      else cls += ' dimmed'
    }
    return cls
  }

  return (
    <div className="question-card">
      <p className="question-text">{question.question}</p>
      {isMulti && !revealed && (
        <p className="multi-hint">
          <span aria-hidden="true">✅</span> Choisis {correct.length} réponses
          puis valide
        </p>
      )}
      <div className="options">
        {question.options.map((opt, i) => (
          <button
            key={opt}
            className={optionClass(i)}
            onClick={() => handleClick(i)}
            aria-disabled={revealed || undefined}
            aria-pressed={
              isMulti && !revealed ? selected.includes(i) : undefined
            }
          >
            <span className="option-letter" aria-hidden="true">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="option-text">{opt}</span>
            {revealed && correct.includes(i) && (
              <span className="option-mark" aria-hidden="true">
                ✓
              </span>
            )}
            {revealed && !correct.includes(i) && selected.includes(i) && (
              <span className="option-mark" aria-hidden="true">
                ✗
              </span>
            )}
          </button>
        ))}
      </div>
      {isMulti && !revealed && (
        <button
          className="btn-primary"
          disabled={selected.length !== correct.length}
          onClick={() => submit(selected)}
        >
          Valider
        </button>
      )}
      {/* Région live montée en permanence pour que l'annonce soit lue par les lecteurs d'écran. */}
      <p className="reference" aria-live="polite">
        {revealed && (
          <>
            {isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse.'}{' '}
            <span aria-hidden="true">📖</span> Référence : {question.reference}
          </>
        )}
      </p>
    </div>
  )
}
