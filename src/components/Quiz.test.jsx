import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Quiz from './Quiz.jsx'

const questions = [
  {
    id: 'q1',
    livre: 'TestLivre',
    question: 'Question un ?',
    options: ['Bon', 'Mauvais'],
    reponses_correctes: [0],
    reference: 'Test 1:1',
  },
  {
    id: 'q2',
    livre: 'TestLivre',
    question: 'Question deux ?',
    options: ['Bon', 'Mauvais'],
    reponses_correctes: [0],
    reference: 'Test 2:2',
  },
]

function answer(user, correct) {
  const label = correct ? 'Bon' : 'Mauvais'
  return user.click(screen.getByText(label).closest('button'))
}

describe('Quiz', () => {
  it('affiche la progression Question X / Y avec un role progressbar', () => {
    render(
      <Quiz livre="TestLivre" questions={questions} onFinish={() => {}} onQuit={() => {}} />,
    )

    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '1')
    expect(progressbar).toHaveAttribute('aria-valuemin', '1')
    expect(progressbar).toHaveAttribute('aria-valuemax', '2')
  })

  it("n'affiche pas de bouton suivant avant d'avoir répondu, puis l'affiche après", async () => {
    const user = userEvent.setup()
    render(
      <Quiz livre="TestLivre" questions={questions} onFinish={() => {}} onQuit={() => {}} />,
    )

    expect(screen.queryByText('Question suivante →')).not.toBeInTheDocument()

    await answer(user, true)

    expect(screen.getByText('Question suivante →')).toBeInTheDocument()
  })

  it('passe à la question suivante et met à jour la progression', async () => {
    const user = userEvent.setup()
    render(
      <Quiz livre="TestLivre" questions={questions} onFinish={() => {}} onQuit={() => {}} />,
    )

    await answer(user, true)
    await user.click(screen.getByText('Question suivante →'))

    expect(screen.getByText('Question 2 / 2')).toBeInTheDocument()
    expect(screen.getByText('Question deux ?')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
  })

  it('sur la dernière question, propose "Voir mon score 🎉" et appelle onFinish avec le score final', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(
      <Quiz livre="TestLivre" questions={questions} onFinish={onFinish} onQuit={() => {}} />,
    )

    await answer(user, true) // question 1 : correcte
    await user.click(screen.getByText('Question suivante →'))

    await answer(user, false) // question 2 : incorrecte
    const finishBtn = screen.getByText('Voir mon score 🎉')
    expect(finishBtn).toBeInTheDocument()

    await user.click(finishBtn)

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith(1) // 1 bonne réponse sur 2
  })

  it('appelle onQuit quand on clique sur "← Quitter"', async () => {
    const user = userEvent.setup()
    const onQuit = vi.fn()
    render(
      <Quiz livre="TestLivre" questions={questions} onFinish={() => {}} onQuit={onQuit} />,
    )

    await user.click(screen.getByText('← Quitter'))

    expect(onQuit).toHaveBeenCalledTimes(1)
  })

  it('retourne null sans planter si la liste de questions est vide', () => {
    const { container } = render(
      <Quiz livre="TestLivre" questions={[]} onFinish={() => {}} onQuit={() => {}} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
