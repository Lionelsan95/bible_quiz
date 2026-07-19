import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

// pickQuestions() uses Math.random (shuffle): the data module is mocked to
// get a deterministic question set for this integration test.
const {
  getBooksMock,
  getDifficultiesMock,
  pickQuestionsMock,
  pickQuestionsByDifficultyMock,
} = vi.hoisted(() => {
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
      { book: 'Genèse', count: 40 },
      { book: 'Exode', count: 35 },
    ]),
    getDifficultiesMock: vi.fn(() => [
      { difficulty: 'easy', count: 111 },
      { difficulty: 'medium', count: 242 },
      { difficulty: 'hard', count: 151 },
    ]),
    pickQuestionsMock: vi.fn((book, n) => mockQuestions.slice(0, n)),
    pickQuestionsByDifficultyMock: vi.fn((difficulty, n) =>
      mockQuestions.slice(0, n),
    ),
  }
})

vi.mock('./data/questions.js', () => ({
  getBooks: getBooksMock,
  getDifficulties: getDifficultiesMock,
  pickQuestions: pickQuestionsMock,
  pickQuestionsByDifficulty: pickQuestionsByDifficultyMock,
}))

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
// is cleared before each test to stay isolated. The data mocks are module-level
// and hoisted, so their call records outlive a test — clear those too, or a
// "was not called" assertion would see an earlier test's calls.
beforeEach(() => {
  localStorage.clear()
  getBooksMock.mockClear()
  getDifficultiesMock.mockClear()
  pickQuestionsMock.mockClear()
  pickQuestionsByDifficultyMock.mockClear()
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

  it('selecting a book → quiz → results → replay the same book', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))

    // Quiz screen
    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('Question mock un ?')).toBeInTheDocument()

    await playThroughQuiz(user)

    // Results screen
    expect(screen.getByText('Quiz terminé !')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(screen.getByText('100% de bonnes réponses')).toBeInTheDocument()

    // Replaying this book starts a fresh quiz on the same book.
    await user.click(screen.getByRole('button', { name: /Rejouer ce livre/ }))

    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('Question mock un ?')).toBeInTheDocument()
    expect(pickQuestionsMock).toHaveBeenCalledWith('Genèse', 10, 'fr')
  })

  it('selecting a book → quiz → results → change book returns to home', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))
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

    await user.click(screen.getByRole('button', { name: /Genèse/ }))
    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()

    await user.click(screen.getByText('← Quitter'))

    expect(
      screen.getByRole('heading', { name: /Quiz Biblique/ }),
    ).toBeInTheDocument()
  })
})

describe('App - difficulty mode', () => {
  async function openDifficultySetup(user) {
    await user.click(
      screen.getByRole('button', { name: /Jouer par difficulté/ }),
    )
  }

  it('home → difficulty setup → quiz draws from the chosen level and count', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openDifficultySetup(user)

    expect(
      screen.getByRole('heading', { name: /Quiz par difficulté/ }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Difficile/ }))
    await user.click(screen.getByRole('button', { name: '15' }))
    await user.click(screen.getByRole('button', { name: /Commencer le quiz/ }))

    expect(pickQuestionsByDifficultyMock).toHaveBeenCalledWith('hard', 15, 'fr')
    // The quiz header shows the translated level, not a book name.
    expect(screen.getByText('Difficile')).toBeInTheDocument()
    expect(screen.getByText('Question mock un ?')).toBeInTheDocument()
  })

  it('defaults to the first level and 10 questions', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openDifficultySetup(user)
    await user.click(screen.getByRole('button', { name: /Commencer le quiz/ }))

    expect(pickQuestionsByDifficultyMock).toHaveBeenCalledWith('easy', 10, 'fr')
  })

  it('replay redraws the same level and count', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openDifficultySetup(user)
    await user.click(screen.getByRole('button', { name: /Moyen/ }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: /Commencer le quiz/ }))
    await playThroughQuiz(user)

    expect(screen.getByText('Quiz terminé !')).toBeInTheDocument()

    pickQuestionsByDifficultyMock.mockClear()
    await user.click(screen.getByRole('button', { name: /Rejouer ce niveau/ }))

    expect(pickQuestionsByDifficultyMock).toHaveBeenCalledWith(
      'medium',
      5,
      'fr',
    )
    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
  })

  it('results offers "back to home" instead of "choose another book"', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openDifficultySetup(user)
    await user.click(screen.getByRole('button', { name: /Commencer le quiz/ }))
    await playThroughQuiz(user)

    expect(
      screen.queryByRole('button', { name: /Choisir un autre livre/ }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Retour à l'accueil/ }))

    expect(
      screen.getByRole('heading', { name: /Quiz Biblique/ }),
    ).toBeInTheDocument()
  })

  it('going back from the setup screen returns home without starting a quiz', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openDifficultySetup(user)
    await user.click(screen.getByRole('button', { name: /← Retour/ }))

    expect(
      screen.getByRole('heading', { name: /Quiz Biblique/ }),
    ).toBeInTheDocument()
    expect(pickQuestionsByDifficultyMock).not.toHaveBeenCalled()
  })

  // The language toggle is home-only precisely so a configured quiz can never be
  // redrawn against a different language's pool.
  it('does not render the language toggle on the setup screen', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('button', { name: 'Français' })).toBeInTheDocument()

    await openDifficultySetup(user)

    expect(
      screen.queryByRole('button', { name: 'Français' }),
    ).not.toBeInTheDocument()
  })

  it('a finished difficulty game appears in history under its level name', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openDifficultySetup(user)
    await user.click(screen.getByRole('button', { name: /Difficile/ }))
    await user.click(screen.getByRole('button', { name: /Commencer le quiz/ }))
    await playThroughQuiz(user)

    await user.click(screen.getByRole('button', { name: /Mon historique/ }))

    expect(await screen.findByText('Difficile')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
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

  it('after a finished game, history shows the attempt just played', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))
    await playThroughQuiz(user)

    expect(screen.getByText('Quiz terminé !')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Mon historique/ }))

    expect(await screen.findByText('Genèse')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })
})

describe('App - theme', () => {
  it('changing theme mid-quiz does not reset the revealed answer (QuestionCard is not remounted)', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))
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
