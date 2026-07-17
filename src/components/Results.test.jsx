import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Results from './Results.jsx'

describe('Results', () => {
  it('shows the score and the percentage', () => {
    render(
      <Results
        book="Genèse"
        score={7}
        total={10}
        onReplay={() => {}}
        onChangeBook={() => {}}
      />,
    )

    expect(screen.getByText('Quiz terminé !')).toBeInTheDocument()
    expect(screen.getByText('Genèse')).toBeInTheDocument()
    expect(screen.getByText('7 / 10')).toBeInTheDocument()
    expect(screen.getByText('70% de bonnes réponses')).toBeInTheDocument()
  })

  it.each([
    [10, 10, 'Excellent ! Tu connais très bien ce livre !'], // ratio 1.0 >= 0.9
    [9, 10, 'Excellent ! Tu connais très bien ce livre !'], // ratio 0.9 >= 0.9
    [8, 10, 'Très bien ! Encore un petit effort pour la perfection.'], // ratio 0.8 >= 0.7
    [7, 10, 'Très bien ! Encore un petit effort pour la perfection.'], // ratio 0.7 >= 0.7
    [6, 10, 'Pas mal, continue comme ça !'], // ratio 0.6 >= 0.5
    [5, 10, 'Pas mal, continue comme ça !'], // ratio 0.5 >= 0.5
    [4, 10, 'Continue à lire la Bible, tu vas progresser !'], // ratio 0.4 < 0.5
    [0, 10, 'Continue à lire la Bible, tu vas progresser !'],
  ])('shows the right message for %i/%i', (score, total, expectedMessage) => {
    render(
      <Results
        book="Genèse"
        score={score}
        total={total}
        onReplay={() => {}}
        onChangeBook={() => {}}
      />,
    )

    expect(screen.getByText(expectedMessage)).toBeInTheDocument()
  })

  it('handles a total of 0 without showing NaN', () => {
    render(
      <Results
        book="Genèse"
        score={0}
        total={0}
        onReplay={() => {}}
        onChangeBook={() => {}}
      />,
    )

    expect(screen.getByText('0 / 0')).toBeInTheDocument()
    expect(screen.getByText('0% de bonnes réponses')).toBeInTheDocument()
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })

  it('calls onReplay when clicking "🔄 Rejouer ce livre"', async () => {
    const user = userEvent.setup()
    const onReplay = vi.fn()
    render(
      <Results
        book="Genèse"
        score={5}
        total={10}
        onReplay={onReplay}
        onChangeBook={() => {}}
      />,
    )

    // The emoji is in an aria-hidden span, so target the button by its accessible name.
    await user.click(screen.getByRole('button', { name: /Rejouer ce livre/ }))

    expect(onReplay).toHaveBeenCalledTimes(1)
  })

  it('calls onChangeBook when clicking "📚 Choisir un autre livre"', async () => {
    const user = userEvent.setup()
    const onChangeBook = vi.fn()
    render(
      <Results
        book="Genèse"
        score={5}
        total={10}
        onReplay={() => {}}
        onChangeBook={onChangeBook}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: /Choisir un autre livre/ }),
    )

    expect(onChangeBook).toHaveBeenCalledTimes(1)
  })
})
