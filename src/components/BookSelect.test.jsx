import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '../i18n/index.js'
import BookSelect from './BookSelect.jsx'

const { getBooksMock } = vi.hoisted(() => ({
  getBooksMock: vi.fn(() => [
    {
      book: 'Genèse',
      count: 3,
      levels: [
        { level: 'easy', count: 2 },
        { level: 'medium', count: 1 },
        { level: 'hard', count: 0 },
      ],
    },
    { book: 'Exode', count: 35, levels: [] },
  ]),
}))

vi.mock('../data/questions.js', () => ({
  getBooks: getBooksMock,
}))

describe('BookSelect', () => {
  it('renders the book grid', () => {
    render(<BookSelect onSelect={() => {}} />)

    expect(screen.getByRole('button', { name: /Genèse/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exode/ })).toBeInTheDocument()
  })

  it('clicking a book reveals the level panel with 3 level buttons', async () => {
    const user = userEvent.setup()
    render(<BookSelect onSelect={() => {}} />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))

    expect(screen.getByRole('group', { name: 'Niveau' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Facile/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Moyen/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Difficile/ }),
    ).toBeInTheDocument()
    // The book grid is gone while the level panel is shown.
    expect(
      screen.queryByRole('button', { name: /^Exode/ }),
    ).not.toBeInTheDocument()
  })

  it('a level with count 0 is aria-disabled (not native disabled) and not clickable', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<BookSelect onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))
    const hardBtn = screen.getByRole('button', { name: /Difficile/ })

    expect(hardBtn).toHaveAttribute('aria-disabled', 'true')
    expect(hardBtn).not.toBeDisabled()

    await user.click(hardBtn)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('clicking an enabled level calls onSelect with the book and level', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<BookSelect onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))
    await user.click(screen.getByRole('button', { name: /^Facile/ }))

    expect(onSelect).toHaveBeenCalledWith('Genèse', 'easy')
  })

  it('the back control returns to the grid without calling onSelect', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<BookSelect onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))
    await user.click(screen.getByText('← Retour aux livres'))

    expect(screen.getByRole('button', { name: /Genèse/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exode/ })).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('resets the pending level selection when the language changes', async () => {
    const user = userEvent.setup()
    render(<BookSelect onSelect={() => {}} />)

    await user.click(screen.getByRole('button', { name: /Genèse/ }))
    expect(screen.getByRole('group', { name: 'Niveau' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'English' }))

    // Back on the (now English-language-triggered) grid, not a stale panel.
    expect(
      screen.queryByRole('group', { name: 'Niveau' }),
    ).not.toBeInTheDocument()
    expect(i18n.language).toBe('en')
  })
})
