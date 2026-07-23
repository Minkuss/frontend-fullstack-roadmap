import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { StatusPill } from './StatusPill'

describe('UI primitives', () => {
  it('keeps native button semantics and accepts a restrained variant', () => {
    render(
      <Button type="button" variant="secondary" disabled>
        Продолжить
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Продолжить' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('button--secondary')
  })

  it('renders a textual topic status', () => {
    render(<StatusPill tone="paused">Приостановлено</StatusPill>)

    expect(screen.getByText('Приостановлено')).toHaveClass(
      'status-pill--paused',
    )
  })

  it('composes calm empty-state copy with an optional action', () => {
    render(
      <EmptyState
        title="Текущей темы пока нет"
        action={<a href="#/roadmap">Открыть roadmap</a>}
      >
        Можно спокойно выбрать направление без дедлайна.
      </EmptyState>,
    )

    expect(
      screen.getByRole('heading', { name: 'Текущей темы пока нет' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/без дедлайна/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Открыть roadmap' })).toHaveAttribute(
      'href',
      '#/roadmap',
    )
  })
})
