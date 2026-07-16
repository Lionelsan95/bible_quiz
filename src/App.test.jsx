import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

// pickQuestions() utilise Math.random (mélange) : on mocke le module de données
// pour obtenir un jeu de questions déterministe dans ce test d'intégration.
const { mockQuestions, getBooksMock, pickQuestionsMock } = vi.hoisted(() => {
  const mockQuestions = [
    {
      id: 'mock_1',
      livre: 'Genèse',
      question: 'Question mock un ?',
      options: ['Bon', 'Mauvais'],
      reponses_correctes: [0],
      reference: 'Mock 1:1',
    },
    {
      id: 'mock_2',
      livre: 'Genèse',
      question: 'Question mock deux ?',
      options: ['Bon', 'Mauvais'],
      reponses_correctes: [0],
      reference: 'Mock 2:2',
    },
  ]

  return {
    mockQuestions,
    getBooksMock: vi.fn(() => [
      { livre: 'Genèse', count: 40 },
      { livre: 'Exode', count: 35 },
    ]),
    pickQuestionsMock: vi.fn((livre, n) => mockQuestions.slice(0, n)),
  }
})

vi.mock('./data/questions.js', () => ({
  getBooks: getBooksMock,
  pickQuestions: pickQuestionsMock,
}))

async function playThroughQuiz(user) {
  // Question 1
  await user.click(screen.getByText('Bon').closest('button'))
  await user.click(screen.getByText('Question suivante →'))

  // Question 2 (dernière)
  await user.click(screen.getByText('Bon').closest('button'))
  await user.click(screen.getByText('Voir mon score 🎉'))
}

describe('App - flux complet', () => {
  it("affiche l'accueil avec la liste des livres au démarrage", () => {
    render(<App />)

    expect(screen.getByText('📖 Quiz Biblique')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Genèse/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exode/ })).toBeInTheDocument()
  })

  it('sélection d\'un livre → quiz → résultats → rejouer le même livre', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))

    // Écran quiz
    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('Question mock un ?')).toBeInTheDocument()

    await playThroughQuiz(user)

    // Écran résultats
    expect(screen.getByText('Quiz terminé !')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(screen.getByText('100% de bonnes réponses')).toBeInTheDocument()

    // Rejouer ce livre relance un quiz frais sur le même livre.
    await user.click(screen.getByRole('button', { name: /Rejouer ce livre/ }))

    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('Question mock un ?')).toBeInTheDocument()
    expect(pickQuestionsMock).toHaveBeenCalledWith('Genèse', 10)
  })

  it('sélection d\'un livre → quiz → résultats → changer de livre revient à l\'accueil', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))
    await playThroughQuiz(user)

    expect(screen.getByText('Quiz terminé !')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Choisir un autre livre/ }))

    expect(screen.getByText('📖 Quiz Biblique')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Genèse/ })).toBeInTheDocument()
  })

  it('quitter le quiz en cours de route revient à l\'accueil', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))
    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()

    await user.click(screen.getByText('← Quitter'))

    expect(screen.getByText('📖 Quiz Biblique')).toBeInTheDocument()
  })
})
