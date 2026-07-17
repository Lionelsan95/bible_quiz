import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from './ThemeToggle.jsx'

describe('ThemeToggle', () => {
  it('renders Clair, Sombre and Auto buttons, with Auto active by default', () => {
    render(<ThemeToggle />)

    const lightBtn = screen.getByRole('button', { name: 'Clair' })
    const darkBtn = screen.getByRole('button', { name: 'Sombre' })
    const autoBtn = screen.getByRole('button', { name: 'Auto' })

    expect(lightBtn).toBeInTheDocument()
    expect(darkBtn).toBeInTheDocument()
    expect(autoBtn).toBeInTheDocument()

    expect(autoBtn).toHaveAttribute('aria-pressed', 'true')
    expect(lightBtn).toHaveAttribute('aria-pressed', 'false')
    expect(darkBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('never uses the native disabled attribute on any option', () => {
    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Clair' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sombre' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Auto' })).not.toBeDisabled()
  })

  it('clicking Sombre sets data-theme, persists it, and moves aria-pressed to Dark', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Sombre' }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('quiz-biblique.theme')).toBe('dark')

    expect(screen.getByRole('button', { name: 'Sombre' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Clair' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Auto' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('clicking Clair after Sombre moves the active state back to Light', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Sombre' }))
    await user.click(screen.getByRole('button', { name: 'Clair' }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem('quiz-biblique.theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Clair' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Sombre' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
