import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HistoryScreen from './HistoryScreen.jsx'

const { listAttemptsMock } = vi.hoisted(() => ({
  listAttemptsMock: vi.fn(),
}))

vi.mock('../history/historyStore.js', () => ({
  listAttempts: listAttemptsMock,
}))

describe('HistoryScreen', () => {
  it('shows a loading state then the empty message if there are no attempts', async () => {
    listAttemptsMock.mockResolvedValue([])
    render(<HistoryScreen onBack={() => {}} />)

    expect(screen.getByText('Chargement…')).toBeInTheDocument()

    expect(
      await screen.findByText(
        'Aucune partie enregistrée pour le moment. Termine un quiz pour le voir apparaître ici !',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Chargement…')).not.toBeInTheDocument()
  })

  it('shows a loading state then the list of attempts', async () => {
    listAttemptsMock.mockResolvedValue([
      {
        id: 'a',
        book: 'Genèse',
        score: 8,
        total: 10,
        completedAt: '2026-07-10T10:00:00.000Z',
      },
      {
        id: 'b',
        book: 'Exode',
        score: 5,
        total: 10,
        completedAt: '2026-07-09T10:00:00.000Z',
      },
    ])
    render(<HistoryScreen onBack={() => {}} />)

    expect(screen.getByText('Chargement…')).toBeInTheDocument()

    expect(await screen.findByText('Genèse')).toBeInTheDocument()
    expect(screen.getByText('8 / 10')).toBeInTheDocument()
    expect(screen.getByText('Exode')).toBeInTheDocument()
    expect(screen.getByText('5 / 10')).toBeInTheDocument()
  })

  it('calls onBack when clicking "← Retour"', async () => {
    listAttemptsMock.mockResolvedValue([])
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<HistoryScreen onBack={onBack} />)

    await user.click(screen.getByText('← Retour'))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('shows the empty message if loading fails', async () => {
    listAttemptsMock.mockRejectedValue(new Error('boom'))
    render(<HistoryScreen onBack={() => {}} />)

    await waitFor(() => {
      expect(
        screen.getByText(
          'Aucune partie enregistrée pour le moment. Termine un quiz pour le voir apparaître ici !',
        ),
      ).toBeInTheDocument()
    })
  })
})
