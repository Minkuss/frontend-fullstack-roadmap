import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProgressProvider } from '../../app/ProgressProvider'
import { createInitialProgress } from '../../domain/progress/progressReducer'
import type { ProgressState } from '../../domain/progress/types'
import { FocusPage } from './FocusPage'

const NOW = '2026-07-23T12:00:00.000Z'

function renderFocus(state: ProgressState) {
  const storage = {
    getItem: vi.fn(() => JSON.stringify(state)),
    setItem: vi.fn((_key: string, _value: string) => undefined),
  }

  render(
    <ProgressProvider storage={storage}>
      <FocusPage getNow={() => NOW} />
    </ProgressProvider>,
  )

  return storage
}

describe('FocusPage', () => {
  it('offers a recommendation without starting it automatically', () => {
    const storage = renderFocus(createInitialProgress())

    expect(
      screen.getByRole('heading', { name: 'Фокус ещё не выбран' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/следующая доступная тема/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Сделать текущим фокусом' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /предсказать порядок вызовов и разрешение имён через execution context/i,
      ),
    ).toBeInTheDocument()
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('explains the active topic, current step, time, and same-topic quick step', () => {
    const state: ProgressState = {
      ...createInitialProgress(),
      activeTopicId: 'call-stack',
      topics: {
        'call-stack': {
          status: 'active',
          completedSteps: {
            source: '2026-07-23T09:00:00.000Z',
          },
          startedAt: '2026-07-23T08:00:00.000Z',
        },
      },
    }

    renderFocus(state)

    expect(
      screen.getByText(/ментальная модель фронтенда · javascript/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Продолжить начатое')).toBeInTheDocument()
    expect(screen.getByText(/текущий шаг: obsidian/i)).toBeInTheDocument()
    expect(screen.getByText(/75–105 мин/i)).toBeInTheDocument()

    const quickStep = screen.getByRole('complementary', {
      name: 'Короткий шаг из текущей темы',
    })
    expect(quickStep).toHaveTextContent(/10–15 минут/)
    expect(quickStep).toHaveTextContent(
      /нарисовать call stack и scope chain/i,
    )
  })

  it('shows up to three next topics and a due review in separate sections', () => {
    const state: ProgressState = {
      ...createInitialProgress(),
      activeTopicId: 'call-stack',
      topics: {
        'call-stack': {
          status: 'active',
          completedSteps: {},
          startedAt: '2026-07-20T08:00:00.000Z',
        },
        closures: {
          status: 'awaiting_review',
          completedSteps: {
            source: '2026-07-17T08:00:00.000Z',
            obsidian: '2026-07-17T09:00:00.000Z',
            anki: '2026-07-17T10:00:00.000Z',
            practice: '2026-07-17T11:00:00.000Z',
            selfCheck: '2026-07-17T12:00:00.000Z',
          },
          startedAt: '2026-07-17T07:00:00.000Z',
          reviewDueAt: '2026-07-20T12:00:00.000Z',
        },
      },
    }

    renderFocus(state)

    const next = screen.getByRole('region', { name: 'Следующие темы' })
    expect(within(next).getAllByRole('listitem')).toHaveLength(3)

    const review = screen.getByRole('region', {
      name: 'Первое повторение',
    })
    expect(review).toHaveTextContent('Замыкания и захват переменных')
    expect(review).toHaveTextContent('Можно повторить сейчас')
    expect(next).not.toContainElement(
      within(review).getByRole('link', {
        name: 'Замыкания и захват переменных',
      }),
    )
  })
})
