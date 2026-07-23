import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { ProgressProvider } from './ProgressProvider'

describe('App', () => {
  it('renders the focus placeholder inside the product shell', () => {
    window.history.replaceState(null, '', '/#/focus')
    const storage = {
      getItem: () => null,
      setItem: () => undefined,
    }

    render(
      <ProgressProvider storage={storage}>
        <App />
      </ProgressProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Фокус' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Frontend Path/ })).toHaveAttribute(
      'href',
      '#/focus',
    )
  })
})
