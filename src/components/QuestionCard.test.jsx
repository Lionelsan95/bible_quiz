import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionCard from './QuestionCard.jsx'

const simpleQuestion = {
  id: 'q-simple',
  text: 'Quelle est la capitale de la France ?',
  options: ['Lyon', 'Paris', 'Marseille', 'Nice'],
  correctAnswers: [1],
  reference: 'Test 1:1',
}

const multiQuestion = {
  id: 'q-multi',
  text: 'Quels fruits sont des agrumes ?',
  options: ['Orange', 'Pomme', 'Citron', 'Banane'],
  correctAnswers: [0, 2],
  reference: 'Test 2:2',
}

describe('QuestionCard - simple mode (single correct answer)', () => {
  it('shows the question and the options', () => {
    render(<QuestionCard question={simpleQuestion} onAnswer={() => {}} />)
    expect(screen.getByText(simpleQuestion.text)).toBeInTheDocument()
    for (const opt of simpleQuestion.options) {
      expect(screen.getByText(opt)).toBeInTheDocument()
    }
  })

  it('clicking the correct answer: calls onAnswer(true), applies the correct class, announces "Bonne réponse !"', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<QuestionCard question={simpleQuestion} onAnswer={onAnswer} />)

    await user.click(screen.getByText('Paris').closest('button'))

    expect(onAnswer).toHaveBeenCalledWith(true)
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Paris').closest('button')).toHaveClass('correct')
    expect(screen.getByText(/Bonne réponse !/)).toBeInTheDocument()
  })

  it('clicking a wrong answer: calls onAnswer(false), wrong/correct/dimmed classes, announces "Mauvaise réponse."', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<QuestionCard question={simpleQuestion} onAnswer={onAnswer} />)

    await user.click(screen.getByText('Lyon').closest('button'))

    expect(onAnswer).toHaveBeenCalledWith(false)
    expect(screen.getByText('Lyon').closest('button')).toHaveClass('wrong')
    expect(screen.getByText('Paris').closest('button')).toHaveClass('correct')
    expect(screen.getByText('Marseille').closest('button')).toHaveClass(
      'dimmed',
    )
    expect(screen.getByText('Nice').closest('button')).toHaveClass('dimmed')
    expect(screen.getByText(/Mauvaise réponse\./)).toBeInTheDocument()
  })

  it('marks the buttons aria-disabled after reveal', async () => {
    const user = userEvent.setup()
    render(<QuestionCard question={simpleQuestion} onAnswer={() => {}} />)

    await user.click(screen.getByText('Paris').closest('button'))

    for (const opt of simpleQuestion.options) {
      expect(screen.getByText(opt).closest('button')).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    }
  })

  it('ignores clicks once the answer is revealed', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<QuestionCard question={simpleQuestion} onAnswer={onAnswer} />)

    await user.click(screen.getByText('Paris').closest('button'))
    expect(onAnswer).toHaveBeenCalledTimes(1)

    // A second click on another option, after reveal, must change nothing.
    await user.click(screen.getByText('Lyon').closest('button'))

    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Paris').closest('button')).toHaveClass('correct')
    expect(screen.getByText('Lyon').closest('button')).toHaveClass('dimmed')
    expect(screen.getByText('Lyon').closest('button')).not.toHaveClass('wrong')
  })
})

describe('QuestionCard - multi mode (several correct answers)', () => {
  it('shows the "Choisis N réponses" hint and a disabled Valider button initially', () => {
    render(<QuestionCard question={multiQuestion} onAnswer={() => {}} />)

    expect(
      screen.getByText(/Choisis 2 réponses puis valide/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
  })

  it('handles selection/deselection with aria-pressed and enables Valider when the count matches', async () => {
    const user = userEvent.setup()
    render(<QuestionCard question={multiQuestion} onAnswer={() => {}} />)

    const orangeBtn = screen.getByText('Orange').closest('button')
    const citronBtn = screen.getByText('Citron').closest('button')
    const validerBtn = screen.getByRole('button', { name: 'Valider' })

    expect(orangeBtn).toHaveAttribute('aria-pressed', 'false')

    await user.click(orangeBtn)
    expect(orangeBtn).toHaveAttribute('aria-pressed', 'true')
    expect(validerBtn).toBeDisabled() // only one of 2 required selections

    await user.click(citronBtn)
    expect(citronBtn).toHaveAttribute('aria-pressed', 'true')
    expect(validerBtn).toBeEnabled() // 2 selections == 2 expected correct answers

    // Deselecting: Valider becomes disabled again.
    await user.click(orangeBtn)
    expect(orangeBtn).toHaveAttribute('aria-pressed', 'false')
    expect(validerBtn).toBeDisabled()
  })

  it('validates a correct combination: onAnswer(true) and correct classes on the right indices', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<QuestionCard question={multiQuestion} onAnswer={onAnswer} />)

    await user.click(screen.getByText('Orange').closest('button'))
    await user.click(screen.getByText('Citron').closest('button'))
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(onAnswer).toHaveBeenCalledWith(true)
    expect(screen.getByText('Orange').closest('button')).toHaveClass('correct')
    expect(screen.getByText('Citron').closest('button')).toHaveClass('correct')
    expect(screen.getByText('Pomme').closest('button')).toHaveClass('dimmed')
    expect(screen.getByText('Banane').closest('button')).toHaveClass('dimmed')
    expect(screen.getByText(/Bonne réponse !/)).toBeInTheDocument()
  })

  it('validates an incorrect combination: onAnswer(false) and the wrong class on the wrong choice', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<QuestionCard question={multiQuestion} onAnswer={onAnswer} />)

    await user.click(screen.getByText('Orange').closest('button')) // correct
    await user.click(screen.getByText('Pomme').closest('button')) // incorrect
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(onAnswer).toHaveBeenCalledWith(false)
    expect(screen.getByText('Orange').closest('button')).toHaveClass('correct')
    expect(screen.getByText('Citron').closest('button')).toHaveClass('correct')
    expect(screen.getByText('Pomme').closest('button')).toHaveClass('wrong')
    expect(screen.getByText(/Mauvaise réponse\./)).toBeInTheDocument()
  })

  it('after reveal, the Valider button disappears and options are aria-disabled', async () => {
    const user = userEvent.setup()
    render(<QuestionCard question={multiQuestion} onAnswer={() => {}} />)

    await user.click(screen.getByText('Orange').closest('button'))
    await user.click(screen.getByText('Citron').closest('button'))
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(
      screen.queryByRole('button', { name: 'Valider' }),
    ).not.toBeInTheDocument()
    for (const opt of multiQuestion.options) {
      expect(screen.getByText(opt).closest('button')).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    }
  })
})
