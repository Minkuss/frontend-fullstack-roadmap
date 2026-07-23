import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('renders accessible landmarks and marks the current page', () => {
    render(
      <AppShell route={{ page: 'roadmap' }}>
        <h1>Все маршруты</h1>
      </AppShell>,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    const navigation = screen.getByRole('navigation', {
      name: 'Основная навигация',
    })
    expect(within(navigation).getByRole('link', { name: 'Roadmap' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { name: 'Все маршруты' }),
    )
  })

  it('treats a topic as part of the roadmap navigation section', () => {
    render(
      <AppShell route={{ page: 'topic', topicId: 'event-loop' }}>
        <h1>Event loop</h1>
      </AppShell>,
    )

    expect(screen.getByRole('link', { name: 'Roadmap' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('focuses main without changing the current hash route', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/#/roadmap')
    render(
      <AppShell route={{ page: 'roadmap' }}>
        <h1>Все маршруты</h1>
      </AppShell>,
    )

    await user.click(screen.getByRole('link', { name: 'К содержанию' }))

    expect(window.location.hash).toBe('#/roadmap')
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it.each([
    [
      'invalid' as const,
      'Не удалось прочитать сохранённый прогресс.',
    ],
    [
      'unavailable' as const,
      'Прогресс пока не сохраняется в этом браузере.',
    ],
  ])('announces the %s storage warning without blocking content', (warning, copy) => {
    render(
      <AppShell route={{ page: 'focus' }} storageWarning={warning}>
        <h1>Фокус</h1>
      </AppShell>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(copy)
    expect(screen.getByRole('main')).toHaveTextContent('Фокус')
  })
})
