import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

// pickQuestions() uses Math.random (shuffle): the data module is mocked to
// get a deterministic question set for this integration test.
const { getBooksMock, pickQuestionsMock } = vi.hoisted(() => {
  const mockQuestions = [
    {
      id: 'mock_1',
      book: 'Genèse',
      text: 'Question mock un ?',
      options: ['Bon', 'Mauvais'],
      correctAnswers: [0],
      reference: 'Mock 1:1',
    },
    {
      id: 'mock_2',
      book: 'Genèse',
      text: 'Question mock deux ?',
      options: ['Bon', 'Mauvais'],
      correctAnswers: [0],
      reference: 'Mock 2:2',
    },
  ]

  return {
    getBooksMock: vi.fn(() => [
      {
        book: 'Genèse',
        count: 40,
        levels: [
          { level: 'easy', count: 2 },
          { level: 'medium', count: 0 },
          { level: 'hard', count: 0 },
        ],
      },
      {
        book: 'Exode',
        count: 35,
        levels: [
          { level: 'easy', count: 1 },
          { level: 'medium', count: 0 },
          { level: 'hard', count: 0 },
        ],
      },
    ]),
    pickQuestionsMock: vi.fn((book, n) => mockQuestions.slice(0, n)),
  }
})

vi.mock('./data/questions.js', () => ({
  getBooks: getBooksMock,
  pickQuestions: pickQuestionsMock,
}))

// Clicks a book card, then the "Facile" (easy) level button that follows it —
// the only enabled level for both mocked books above.
async function selectBook(user, bookName) {
  await user.click(screen.getByRole('button', { name: new RegExp(bookName) }))
  await user.click(screen.getByRole('button', { name: /^Facile/ }))
}

async function playThroughQuiz(user) {
  // Question 1
  await user.click(screen.getByText('Bon').closest('button'))
  await user.click(screen.getByText('Question suivante →'))

  // Question 2 (last)
  await user.click(screen.getByText('Bon').closest('button'))
  // The emoji is in an aria-hidden span, so target the button by its accessible name.
  await user.click(screen.getByRole('button', { name: /Voir mon score/ }))
}

// History relies on jsdom's real localStorage (not mocked in this file): it
// is cleared before each test to stay isolated.
beforeEach(() => {
  localStorage.clear()
})

describe('App - full flow', () => {
  it('shows the home screen with the book list on startup', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /Quiz Biblique/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Genèse/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exode/ })).toBeInTheDocument()
  })

  it('selecting a book → level → quiz → results → replay preserves book and level', async () => {
    const user = userEvent.setup()
    render(<App />)

    await selectBook(user, 'Genèse')

    // Quiz screen
    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('Question mock un ?')).toBeInTheDocument()

    await playThroughQuiz(user)

    // Results screen
    expect(screen.getByText('Quiz terminé !')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(screen.getByText('100% de bonnes réponses')).toBeInTheDocument()

    // Replaying this book starts a fresh quiz on the same book AND level,
    // without going back through BookSelect's level panel.
    await user.click(screen.getByRole('button', { name: /Rejouer ce livre/ }))

    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('Question mock un ?')).toBeInTheDocument()
    expect(pickQuestionsMock).toHaveBeenNthCalledWith(1, 'Genèse', 10, {
      lang: 'fr',
      level: 'easy',
    })
    expect(pickQuestionsMock).toHaveBeenNthCalledWith(2, 'Genèse', 10, {
      lang: 'fr',
      level: 'easy',
    })
  })

  it('selecting a book → level → quiz → results → change book returns to home', async () => {
    const user = userEvent.setup()
    render(<App />)

    await selectBook(user, 'Genèse')
    await playThroughQuiz(user)

    expect(screen.getByText('Quiz terminé !')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Choisir un autre livre/ }),
    )

    expect(
      screen.getByRole('heading', { name: /Quiz Biblique/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Genèse/ })).toBeInTheDocument()
  })

  it('quitting the quiz mid-way returns to home', async () => {
    const user = userEvent.setup()
    render(<App />)

    await selectBook(user, 'Genèse')
    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()

    await user.click(screen.getByText('← Quitter'))

    expect(
      screen.getByRole('heading', { name: /Quiz Biblique/ }),
    ).toBeInTheDocument()
  })

  it('picking a book shows its level panel; back returns to the book grid', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))

    expect(screen.getByRole('button', { name: /^Facile/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Difficile/ }),
    ).toHaveAttribute('aria-disabled', 'true')

    await user.click(screen.getByText('← Retour aux livres'))

    expect(screen.getByRole('button', { name: /Genèse/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exode/ })).toBeInTheDocument()
  })
})

describe('App - history', () => {
  it('from home, "Mon historique" shows the history screen', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Mon historique/ }))

    expect(screen.getByText('Mon historique')).toBeInTheDocument()
    await screen.findByText(
      'Aucune partie enregistrée pour le moment. Termine un quiz pour le voir apparaître ici !',
    )
  })

  it('after a finished game, history shows the attempt just played, with its level', async () => {
    const user = userEvent.setup()
    render(<App />)

    await selectBook(user, 'Genèse')
    await playThroughQuiz(user)

    expect(screen.getByText('Quiz terminé !')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Mon historique/ }))

    expect(await screen.findByText('Genèse')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(screen.getByText('Facile')).toBeInTheDocument()
  })
})

describe('App - theme', () => {
  it('changing theme mid-quiz does not reset the revealed answer (QuestionCard is not remounted)', async () => {
    const user = userEvent.setup()
    render(<App />)

    await selectBook(user, 'Genèse')
    expect(screen.getByText('Question mock un ?')).toBeInTheDocument()

    // Reveal the answer: selection + correctness feedback + "next" button.
    await user.click(screen.getByText('Bon').closest('button'))
    expect(screen.getByText('Bon').closest('button')).toHaveClass('correct')
    expect(screen.getByText(/Bonne réponse !/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Question suivante →' }),
    ).toBeInTheDocument()

    // ThemeToggle lives in the app toolbar, outside Quiz/QuestionCard: a
    // theme change only flips an attribute on <html>, it must not remount
    // the current question and wipe its local reveal state.
    await user.click(screen.getByRole('button', { name: 'Sombre' }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByText('Question mock un ?')).toBeInTheDocument()
    expect(screen.getByText('Bon').closest('button')).toHaveClass('correct')
    expect(screen.getByText(/Bonne réponse !/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Question suivante →' }),
    ).toBeInTheDocument()
  })
})
