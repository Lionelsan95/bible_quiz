import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '../i18n/index.js'
import LanguageToggle from './LanguageToggle.jsx'

describe('LanguageToggle', () => {
  it('renders FR and EN buttons with FR active by default', () => {
    render(<LanguageToggle />)

    const frBtn = screen.getByRole('button', { name: 'Français' })
    const enBtn = screen.getByRole('button', { name: 'English' })

    expect(frBtn).toBeInTheDocument()
    expect(enBtn).toBeInTheDocument()
    expect(frBtn).toHaveAttribute('aria-pressed', 'true')
    expect(enBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('never uses the native disabled attribute on either option', () => {
    render(<LanguageToggle />)

    expect(screen.getByRole('button', { name: 'Français' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'English' })).not.toBeDisabled()
  })

  it('clicking EN switches i18n.language and persists it to localStorage', async () => {
    const user = userEvent.setup()
    render(<LanguageToggle />)

    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(i18n.language).toBe('en')
    expect(localStorage.getItem('quiz-biblique.lang')).toBe('en')
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
