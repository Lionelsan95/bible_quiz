import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DifficultySetup from './DifficultySetup.jsx'
import { getDifficulties } from '../data/questions.js'

vi.mock('../data/questions.js', () => ({
  getDifficulties: vi.fn(),
}))

beforeEach(() => {
  getDifficulties.mockReturnValue([
    { difficulty: 'easy', count: 111 },
    { difficulty: 'medium', count: 242 },
    { difficulty: 'hard', count: 151 },
  ])
})

function setup(props = {}) {
  return render(
    <DifficultySetup onStart={() => {}} onBack={() => {}} {...props} />,
  )
}

describe('DifficultySetup', () => {
  it('lists every level with its translated name and question count', () => {
    setup()

    expect(screen.getByRole('button', { name: /Facile/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Moyen/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Difficile/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('111 questions')).toBeInTheDocument()
  })

  it('offers the four question-count options', () => {
    setup()

    for (const count of ['5', '10', '15', '20']) {
      expect(screen.getByRole('button', { name: count })).toBeInTheDocument()
    }
  })

  it('preselects the first level and 10 questions', () => {
    setup()

    expect(screen.getByRole('button', { name: /Facile/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('moves the pressed state when another level is chosen', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /Difficile/ }))

    expect(screen.getByRole('button', { name: /Difficile/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /Facile/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  // Selection uses aria-pressed, never the native disabled attribute, so every
  // option stays focusable (project-wide contract for option-style controls).
  it('never disables an option button', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /Moyen/ }))

    for (const button of screen.getAllByRole('button')) {
      expect(button).not.toBeDisabled()
    }
  })

  it('passes the chosen level and count to onStart', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    setup({ onStart })

    await user.click(screen.getByRole('button', { name: /Moyen/ }))
    await user.click(screen.getByRole('button', { name: '20' }))
    await user.click(screen.getByRole('button', { name: /Commencer le quiz/ }))

    expect(onStart).toHaveBeenCalledWith('medium', 20)
  })

  // getDifficulties reports every canonical level, even one with no questions.
  // Such a level could never start a quiz, so it must not be selectable.
  describe('a level with no questions', () => {
    beforeEach(() => {
      getDifficulties.mockReturnValue([
        { difficulty: 'easy', count: 0 },
        { difficulty: 'medium', count: 242 },
        { difficulty: 'hard', count: 151 },
      ])
    })

    it('marks it unavailable without using the native disabled attribute', () => {
      setup()

      const emptyLevel = screen.getByRole('button', { name: /Facile/ })
      expect(emptyLevel).toHaveAttribute('aria-disabled', 'true')
      expect(emptyLevel).not.toBeDisabled()
    })

    it('preselects the first level that actually has questions', () => {
      setup()

      expect(screen.getByRole('button', { name: /Moyen/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })

    it('ignores clicks on it', async () => {
      const user = userEvent.setup()
      const onStart = vi.fn()
      setup({ onStart })

      await user.click(screen.getByRole('button', { name: /Facile/ }))
      await user.click(
        screen.getByRole('button', { name: /Commencer le quiz/ }),
      )

      // Selection stayed on the playable level, so the quiz starts from it.
      expect(onStart).toHaveBeenCalledWith('medium', 10)
    })
  })

  it('calls onBack from the back button', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    setup({ onBack })

    await user.click(screen.getByRole('button', { name: /← Retour/ }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
