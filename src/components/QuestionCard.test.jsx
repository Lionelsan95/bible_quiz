import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionCard from './QuestionCard.jsx'

const simpleQuestion = {
  id: 'q-simple',
  question: 'Quelle est la capitale de la France ?',
  options: ['Lyon', 'Paris', 'Marseille', 'Nice'],
  reponses_correctes: [1],
  reference: 'Test 1:1',
}

const multiQuestion = {
  id: 'q-multi',
  question: 'Quels fruits sont des agrumes ?',
  options: ['Orange', 'Pomme', 'Citron', 'Banane'],
  reponses_correctes: [0, 2],
  reference: 'Test 2:2',
}

describe('QuestionCard - mode simple (une seule bonne réponse)', () => {
  it('affiche la question et les options', () => {
    render(<QuestionCard question={simpleQuestion} onAnswer={() => {}} />)
    expect(screen.getByText(simpleQuestion.question)).toBeInTheDocument()
    for (const opt of simpleQuestion.options) {
      expect(screen.getByText(opt)).toBeInTheDocument()
    }
  })

  it('clic sur la bonne réponse : appelle onAnswer(true), applique la classe correct, annonce "Bonne réponse !"', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<QuestionCard question={simpleQuestion} onAnswer={onAnswer} />)

    await user.click(screen.getByText('Paris').closest('button'))

    expect(onAnswer).toHaveBeenCalledWith(true)
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Paris').closest('button')).toHaveClass('correct')
    expect(screen.getByText(/Bonne réponse !/)).toBeInTheDocument()
  })

  it('clic sur une mauvaise réponse : appelle onAnswer(false), classes wrong/correct/dimmed, annonce "Mauvaise réponse."', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<QuestionCard question={simpleQuestion} onAnswer={onAnswer} />)

    await user.click(screen.getByText('Lyon').closest('button'))

    expect(onAnswer).toHaveBeenCalledWith(false)
    expect(screen.getByText('Lyon').closest('button')).toHaveClass('wrong')
    expect(screen.getByText('Paris').closest('button')).toHaveClass('correct')
    expect(screen.getByText('Marseille').closest('button')).toHaveClass('dimmed')
    expect(screen.getByText('Nice').closest('button')).toHaveClass('dimmed')
    expect(screen.getByText(/Mauvaise réponse\./)).toBeInTheDocument()
  })

  it('marque les boutons aria-disabled après révélation', async () => {
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

  it('ignore les clics une fois la réponse révélée', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<QuestionCard question={simpleQuestion} onAnswer={onAnswer} />)

    await user.click(screen.getByText('Paris').closest('button'))
    expect(onAnswer).toHaveBeenCalledTimes(1)

    // Un second clic sur une autre option, après révélation, ne doit rien changer.
    await user.click(screen.getByText('Lyon').closest('button'))

    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Paris').closest('button')).toHaveClass('correct')
    expect(screen.getByText('Lyon').closest('button')).toHaveClass('dimmed')
    expect(screen.getByText('Lyon').closest('button')).not.toHaveClass('wrong')
  })
})

describe('QuestionCard - mode multi (plusieurs bonnes réponses)', () => {
  it('affiche l\'indice "Choisis N réponses" et le bouton Valider désactivé au départ', () => {
    render(<QuestionCard question={multiQuestion} onAnswer={() => {}} />)

    expect(screen.getByText(/Choisis 2 réponses puis valide/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
  })

  it('gère la sélection/désélection avec aria-pressed et active Valider quand le compte correspond', async () => {
    const user = userEvent.setup()
    render(<QuestionCard question={multiQuestion} onAnswer={() => {}} />)

    const orangeBtn = screen.getByText('Orange').closest('button')
    const citronBtn = screen.getByText('Citron').closest('button')
    const validerBtn = screen.getByRole('button', { name: 'Valider' })

    expect(orangeBtn).toHaveAttribute('aria-pressed', 'false')

    await user.click(orangeBtn)
    expect(orangeBtn).toHaveAttribute('aria-pressed', 'true')
    expect(validerBtn).toBeDisabled() // une seule sélection sur 2 requises

    await user.click(citronBtn)
    expect(citronBtn).toHaveAttribute('aria-pressed', 'true')
    expect(validerBtn).toBeEnabled() // 2 sélections == 2 bonnes réponses attendues

    // Désélection : Valider redevient désactivé.
    await user.click(orangeBtn)
    expect(orangeBtn).toHaveAttribute('aria-pressed', 'false')
    expect(validerBtn).toBeDisabled()
  })

  it('valide une combinaison correcte : onAnswer(true) et classes correct sur les bons index', async () => {
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

  it('valide une combinaison incorrecte : onAnswer(false) et classe wrong sur le mauvais choix', async () => {
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

  it('après révélation, le bouton Valider disparaît et les options sont aria-disabled', async () => {
    const user = userEvent.setup()
    render(<QuestionCard question={multiQuestion} onAnswer={() => {}} />)

    await user.click(screen.getByText('Orange').closest('button'))
    await user.click(screen.getByText('Citron').closest('button'))
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument()
    for (const opt of multiQuestion.options) {
      expect(screen.getByText(opt).closest('button')).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    }
  })
})
