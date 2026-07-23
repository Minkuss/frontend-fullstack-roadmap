import {
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProgressProvider } from '../../app/ProgressProvider'
import { createInitialProgress } from '../../domain/progress/progressReducer'
import type { ProgressState } from '../../domain/progress/types'
import { RoadmapPage } from './RoadmapPage'

const NOW = '2026-07-23T12:00:00.000Z'

function renderRoadmap(state: ProgressState = createInitialProgress()) {
  const storage = {
    getItem: vi.fn(() => JSON.stringify(state)),
    setItem: vi.fn((_key: string, _value: string) => undefined),
  }

  render(
    <ProgressProvider storage={storage}>
      <RoadmapPage getNow={() => NOW} />
    </ProgressProvider>,
  )

  return storage
}

function activeState(topicId: string): ProgressState {
  return {
    ...createInitialProgress(),
    activeTopicId: topicId,
    topics: {
      [topicId]: {
        status: 'active',
        completedSteps: {
          source: '2026-07-23T08:00:00.000Z',
        },
        startedAt: '2026-07-23T07:00:00.000Z',
      },
    },
  }
}

async function openJavascriptModule(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', {
      name: 'Ментальная модель фронтенда',
    }),
  )
  await user.click(
    screen.getByText('JavaScript: выполнение и данные').closest('summary')!,
  )
}

describe('RoadmapPage', () => {
  it('keeps every primary route openable without completion gates', async () => {
    const user = userEvent.setup()
    renderRoadmap(activeState('call-stack'))

    const routes = [
      ['Ментальная модель фронтенда', 'JavaScript: выполнение и данные'],
      ['Надёжный поток данных', 'HTTP и сеть'],
      ['Production frontend', 'Frontend-архитектура'],
      ['Fullstack delivery', 'Node.js и Fastify'],
    ] as const

    for (const [routeTitle, moduleTitle] of routes) {
      await user.click(screen.getByRole('button', { name: routeTitle }))
      expect(
        screen.getByRole('heading', { name: routeTitle, level: 2 }),
      ).toBeInTheDocument()

      const summary = screen.getByText(moduleTitle).closest('summary')
      expect(summary).not.toBeNull()
      await user.click(summary!)
      expect(summary?.parentElement).toHaveAttribute('open')
    }

    expect(
      screen.getByRole('button', {
        name: 'Ментальная модель фронтенда',
      }),
    ).toBeEnabled()
  })

  it('adds a topic to the queue once and exposes a semantic remove control', async () => {
    const user = userEvent.setup()
    const storage = renderRoadmap()
    await openJavascriptModule(user)

    const topicLink = screen.getByRole('link', {
      name: 'Выполнение кода, области видимости и call stack',
    })
    const row = topicLink.closest('li')!
    await user.click(
      within(row).getByRole('button', {
        name: 'Добавить в очередь: Выполнение кода, области видимости и call stack',
      }),
    )

    expect(
      within(row).getByRole('button', {
        name: 'Убрать из очереди: Выполнение кода, области видимости и call stack',
      }),
    ).toBeInTheDocument()
    const queue = screen.getByRole('region', { name: 'Личная очередь' })
    expect(
      within(queue).getAllByRole('link', {
        name: 'Выполнение кода, области видимости и call stack',
      }),
    ).toHaveLength(1)

    await waitFor(() => {
      const saved = JSON.parse(storage.setItem.mock.lastCall?.[1] ?? '{}')
      expect(saved.queue).toEqual(['call-stack'])
    })
  })

  it('marks the first three queued topics with visible priority text', () => {
    renderRoadmap({
      ...createInitialProgress(),
      queue: [
        'call-stack',
        'closures',
        'values-references',
        'functions-this',
      ],
    })

    const queue = screen.getByRole('region', { name: 'Личная очередь' })
    const items = within(queue).getAllByRole('listitem')

    expect(items).toHaveLength(4)
    expect(items[0]).toHaveTextContent('Ближайшая №1')
    expect(items[1]).toHaveTextContent('Ближайшая №2')
    expect(items[2]).toHaveTextContent('Ближайшая №3')
    expect(items[3]).not.toHaveTextContent(/Ближайшая/)
  })

  it('opens a topic without mutating its learning status', async () => {
    const user = userEvent.setup()
    const storage = renderRoadmap()
    await openJavascriptModule(user)

    await user.click(
      screen.getByRole('link', {
        name: 'Выполнение кода, области видимости и call stack',
      }),
    )

    expect(window.location.hash).toBe('#/topic/call-stack')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('changes focus only through the explicit action and confirms pausing another topic', async () => {
    const user = userEvent.setup()
    const storage = renderRoadmap(activeState('values-references'))
    await openJavascriptModule(user)

    const callStackRow = screen
      .getByRole('link', {
        name: 'Выполнение кода, области видимости и call stack',
      })
      .closest('li')!
    await user.click(
      within(callStackRow).getByRole('button', {
        name: 'Сделать фокусом: Выполнение кода, области видимости и call stack',
      }),
    )

    const dialog = screen.getByRole('dialog', {
      name: 'Переключить текущую тему?',
    })
    expect(dialog).toHaveTextContent(
      'Значения, ссылки и неизменяемые обновления',
    )
    expect(dialog).toHaveTextContent(/останется приостановленной/i)
    expect(screen.getByRole('button', { name: 'Остаться здесь' })).toHaveFocus()
    expect(storage.setItem).not.toHaveBeenCalled()

    await user.click(
      within(dialog).getByRole('button', { name: 'Переключить тему' }),
    )

    await waitFor(() => {
      const saved = JSON.parse(storage.setItem.mock.lastCall?.[1] ?? '{}')
      expect(saved.activeTopicId).toBe('call-stack')
      expect(saved.topics['values-references'].status).toBe('paused')
    })
  })

  it('warns about missing dependencies but allows manual focus', async () => {
    const user = userEvent.setup()
    renderRoadmap()
    await openJavascriptModule(user)

    const closureRow = screen
      .getByRole('link', { name: 'Замыкания и захват переменных' })
      .closest('li')!

    expect(closureRow).toHaveTextContent(
      'Полезная база: Выполнение кода, области видимости и call stack',
    )
    expect(closureRow).toHaveTextContent('Выбор доступен')
    expect(
      within(closureRow).getByRole('button', {
        name: 'Сделать фокусом: Замыкания и захват переменных',
      }),
    ).toBeEnabled()
  })

  it('reveals deferred topics only through the explicit «Не сейчас» control', async () => {
    const user = userEvent.setup()
    renderRoadmap()

    expect(
      screen.queryByRole('heading', { name: 'Не сейчас', level: 2 }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Не сейчас' }))

    expect(
      screen.getByRole('heading', { name: 'Не сейчас', level: 2 }),
    ).toBeInTheDocument()
  })
})
