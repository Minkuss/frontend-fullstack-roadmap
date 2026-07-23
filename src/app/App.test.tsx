import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { ProgressProvider } from './ProgressProvider'
import { createInitialProgress } from '../domain/progress/progressReducer'
import type { ProgressState } from '../domain/progress/types'

describe('App', () => {
  it('renders the focus experience inside the product shell', () => {
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
      screen.getByRole('heading', { name: 'Фокус ещё не выбран' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Сделать текущим фокусом' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Frontend Path/ })).toHaveAttribute(
      'href',
      '#/focus',
    )
  })

  it('clears topic-local draft state when hash navigation changes the topic', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/#/topic/call-stack')
    const state: ProgressState = {
      ...createInitialProgress(),
      activeTopicId: 'call-stack',
      topics: {
        'call-stack': {
          status: 'active',
          completedSteps: {
            source: '2026-07-23T08:00:00.000Z',
          },
          startedAt: '2026-07-23T07:00:00.000Z',
        },
      },
    }
    const storage = {
      getItem: () => JSON.stringify(state),
      setItem: () => undefined,
    }

    render(
      <ProgressProvider storage={storage}>
        <App getNow={() => '2026-07-23T12:00:00.000Z'} />
      </ProgressProvider>,
    )

    const obsidian = screen.getByRole('textbox', {
      name: 'Ссылка на заметку в Obsidian (необязательно)',
    })
    await user.type(obsidian, 'черновик-для-call-stack')
    expect(obsidian).toHaveValue('черновик-для-call-stack')

    window.location.hash = '#/topic/values-references'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(
      await screen.findByRole('heading', {
        name: 'Значения, ссылки и неизменяемые обновления',
        level: 1,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', {
        name: 'Ссылка на заметку в Obsidian (необязательно)',
      }),
    ).toHaveValue('')
  })

  it('renders the interactive roadmap instead of a placeholder', () => {
    window.history.replaceState(null, '', '/#/roadmap')
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
      screen.getByRole('button', {
        name: 'Ментальная модель фронтенда',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Маршруты скоро появятся здесь'),
    ).not.toBeInTheDocument()
  })

  it('updates title and moves focus after Enter navigation without stealing initial focus', async () => {
    const user = userEvent.setup()
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

    const main = screen.getByRole('main')
    expect(document.title).toBe('Фокус — Frontend Path')
    expect(main).not.toHaveFocus()

    screen.getByRole('link', { name: 'Roadmap' }).focus()
    await user.keyboard('{Enter}')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Roadmap' }),
    ).toBeInTheDocument()
    expect(document.title).toBe('Roadmap — Frontend Path')
    expect(main).toHaveFocus()

    const topicLink = screen.getByRole('link', {
      name: 'Event loop: task и microtask',
    })
    topicLink.focus()
    await user.keyboard('{Enter}')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Event loop: task и microtask',
      }),
    ).toBeInTheDocument()
    expect(document.title).toBe('Event loop: task и microtask — Frontend Path')
    expect(main).toHaveFocus()
  })
})
