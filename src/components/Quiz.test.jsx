import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Quiz from './Quiz.jsx'

const questions = [
  {
    id: 'q1',
    book: 'TestLivre',
    text: 'Question un ?',
    options: ['Bon', 'Mauvais'],
    correctAnswers: [0],
    reference: 'Test 1:1',
  },
  {
    id: 'q2',
    book: 'TestLivre',
    text: 'Question deux ?',
    options: ['Bon', 'Mauvais'],
    correctAnswers: [0],
    reference: 'Test 2:2',
  },
]

function answer(user, correct) {
  const label = correct ? 'Bon' : 'Mauvais'
  return user.click(screen.getByText(label).closest('button'))
}

describe('Quiz', () => {
  it('shows the Question X / Y progress with a progressbar role', () => {
    render(
      <Quiz
        book="TestLivre"
        questions={questions}
        onFinish={() => {}}
        onQuit={() => {}}
      />,
    )

    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '1')
    expect(progressbar).toHaveAttribute('aria-valuemin', '1')
    expect(progressbar).toHaveAttribute('aria-valuemax', '2')
  })

  it('hides the next button before answering, then shows it after', async () => {
    const user = userEvent.setup()
    render(
      <Quiz
        book="TestLivre"
        questions={questions}
        onFinish={() => {}}
        onQuit={() => {}}
      />,
    )

    expect(screen.queryByText('Question suivante →')).not.toBeInTheDocument()

    await answer(user, true)

    expect(screen.getByText('Question suivante →')).toBeInTheDocument()
  })

  it('moves to the next question and updates progress', async () => {
    const user = userEvent.setup()
    render(
      <Quiz
        book="TestLivre"
        questions={questions}
        onFinish={() => {}}
        onQuit={() => {}}
      />,
    )

    await answer(user, true)
    await user.click(screen.getByText('Question suivante →'))

    expect(screen.getByText('Question 2 / 2')).toBeInTheDocument()
    expect(screen.getByText('Question deux ?')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '2',
    )
  })

  it('on the last question, offers "Voir mon score" and calls onFinish with the final score', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(
      <Quiz
        book="TestLivre"
        questions={questions}
        onFinish={onFinish}
        onQuit={() => {}}
      />,
    )

    await answer(user, true) // question 1: correct
    await user.click(screen.getByText('Question suivante →'))

    await answer(user, false) // question 2: incorrect
    // The emoji is in an aria-hidden span, so target the button by its accessible name.
    const finishBtn = screen.getByRole('button', { name: /Voir mon score/ })
    expect(finishBtn).toBeInTheDocument()

    await user.click(finishBtn)

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith(1) // 1 correct answer out of 2
  })

  it('calls onQuit when clicking "← Quitter"', async () => {
    const user = userEvent.setup()
    const onQuit = vi.fn()
    render(
      <Quiz
        book="TestLivre"
        questions={questions}
        onFinish={() => {}}
        onQuit={onQuit}
      />,
    )

    await user.click(screen.getByText('← Quitter'))

    expect(onQuit).toHaveBeenCalledTimes(1)
  })

  it('returns null without crashing if the question list is empty', () => {
    const { container } = render(
      <Quiz
        book="TestLivre"
        questions={[]}
        onFinish={() => {}}
        onQuit={() => {}}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
