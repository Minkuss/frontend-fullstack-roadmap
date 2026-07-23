import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProgressProvider } from '../../app/ProgressProvider'
import { createInitialProgress } from '../../domain/progress/progressReducer'
import type { ProgressState } from '../../domain/progress/types'
import { TopicPage } from './TopicPage'

const NOW = '2026-07-23T12:00:00.000Z'

function renderTopic(
  topicId: string,
  state: ProgressState = createInitialProgress(),
  now = NOW,
) {
  const storage = {
    getItem: vi.fn(() => JSON.stringify(state)),
    setItem: vi.fn((_key: string, _value: string) => undefined),
  }

  render(
    <ProgressProvider storage={storage}>
      <TopicPage getNow={() => now} topicId={topicId} />
    </ProgressProvider>,
  )

  return storage
}

function activeProgress(
  topicId: string,
  completedSteps: ProgressState['topics'][string]['completedSteps'] = {},
): ProgressState {
  return {
    ...createInitialProgress(),
    activeTopicId: topicId,
    topics: {
      [topicId]: {
        status: 'active',
        completedSteps,
        startedAt: '2026-07-20T08:00:00.000Z',
      },
    },
  }
}

describe('TopicPage', () => {
  it('activates a topic only after the user asks', async () => {
    const user = userEvent.setup()
    const storage = renderTopic('call-stack')

    expect(screen.getByText('Тема ещё не начата')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Сделать текущим фокусом' }),
    )

    expect(screen.getByText('Текущий фокус')).toBeInTheDocument()
    expect(storage.setItem).toHaveBeenCalled()
    expect(storage.setItem.mock.lastCall?.[1]).toContain(
      '"activeTopicId":"call-stack"',
    )
  })

  it('confirms switching topics, traps focus, and pauses the previous one', async () => {
    const user = userEvent.setup()
    const state = activeProgress('values-references', {
      source: '2026-07-21T08:00:00.000Z',
    })
    const storage = renderTopic('call-stack', state)
    const trigger = screen.getByRole('button', {
      name: 'Сделать текущим фокусом',
    })

    await user.click(trigger)

    const dialog = screen.getByRole('dialog', {
      name: 'Переключить текущую тему?',
    })
    expect(dialog).toHaveTextContent(
      'Значения, ссылки и неизменяемые обновления',
    )
    expect(dialog).toHaveTextContent(/останется приостановленной/i)
    expect(screen.getByRole('button', { name: 'Остаться здесь' })).toHaveFocus()

    await user.tab({ shift: true })
    expect(
      screen.getByRole('button', { name: 'Переключить тему' }),
    ).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.click(
      screen.getByRole('button', { name: 'Переключить тему' }),
    )

    expect(
      screen.getByRole('heading', {
        name: 'Выполнение кода, области видимости и call stack',
        level: 1,
      }),
    ).toHaveFocus()
    expect(storage.setItem.mock.lastCall?.[1]).toContain(
      '"values-references":{"status":"paused"',
    )
    expect(storage.setItem.mock.lastCall?.[1]).toContain(
      '"activeTopicId":"call-stack"',
    )
  })

  it('opens learning sources safely in a separate tab', () => {
    renderTopic('call-stack')

    const source = screen.getByRole('link', {
      name: /область видимости переменных, замыкание/i,
    })
    expect(source).toHaveAttribute('target', '_blank')
    expect(source).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('keeps the Obsidian URL optional and editable', async () => {
    const user = userEvent.setup()
    const storage = renderTopic(
      'call-stack',
      activeProgress('call-stack', {
        source: '2026-07-21T08:00:00.000Z',
      }),
    )
    const input = screen.getByRole('textbox', {
      name: 'Ссылка на заметку в Obsidian (необязательно)',
    })

    await user.type(
      input,
      'obsidian://open?vault=my_brain&file=call-stack',
    )
    await user.click(screen.getByRole('button', { name: 'Сохранить ссылку' }))

    expect(input).toHaveValue(
      'obsidian://open?vault=my_brain&file=call-stack',
    )
    expect(storage.setItem.mock.lastCall?.[1]).toContain(
      'obsidian://open?vault=my_brain&file=call-stack',
    )

    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Сохранить ссылку' }))
    expect(input).toHaveValue('')
  })

  it('unlocks six stages in order and requires explicit practice and mastery checks', async () => {
    const user = userEvent.setup()
    renderTopic('call-stack', activeProgress('call-stack'))

    expect(
      screen.getByRole('button', { name: 'Заметка готова' }),
    ).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Источник изучен' }))
    expect(
      screen.getByRole('button', { name: 'Заметка готова' }),
    ).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Заметка готова' }))
    await user.click(screen.getByRole('button', { name: 'Карточки созданы' }))

    const practice = screen.getByRole('region', { name: 'Практика' })
    expect(practice).toHaveTextContent(/минимум/i)
    const practiceButton = within(practice).getByRole('button', {
      name: 'Практика выполнена',
    })
    expect(practiceButton).toBeDisabled()
    await user.click(
      within(practice).getByRole('checkbox', {
        name: /я выполнил указанный минимум/i,
      }),
    )
    await user.click(practiceButton)

    const selfCheck = screen.getByRole('region', {
      name: 'Проверка понимания',
    })
    const selfCheckButton = within(selfCheck).getByRole('button', {
      name: 'Проверка пройдена',
    })
    expect(selfCheckButton).toBeDisabled()

    const masteryChecks = within(selfCheck).getAllByRole('checkbox')
    expect(masteryChecks.length).toBeGreaterThan(1)
    for (const checkbox of masteryChecks) {
      await user.click(checkbox)
    }
    await user.click(selfCheckButton)

    expect(screen.getByText('Ожидает первого повторения')).toBeInTheDocument()
    expect(screen.getByText(/26 июля 2026/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Первое повторение выполнено' }),
    ).toBeDisabled()
  })

  it('marks the topic mastered after a due first review', async () => {
    const user = userEvent.setup()
    const state: ProgressState = {
      ...createInitialProgress(),
      topics: {
        'call-stack': {
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

    renderTopic('call-stack', state)
    await user.click(
      screen.getByRole('button', {
        name: 'Первое повторение выполнено',
      }),
    )

    expect(screen.getByText('Тема освоена')).toBeInTheDocument()
  })

  it('warns about missing dependencies without blocking manual focus', () => {
    renderTopic('closures')

    const warning = screen.getByRole('note', {
      name: 'Не завершены зависимости',
    })
    expect(warning).toHaveTextContent(
      'Выполнение кода, области видимости и call stack',
    )
    expect(
      screen.getByRole('button', { name: 'Сделать текущим фокусом' }),
    ).toBeEnabled()
  })

  it('takes action timestamps from the clock at click time', async () => {
    const user = userEvent.setup()
    let clock = NOW
    const state = activeProgress('call-stack')
    const storage = {
      getItem: vi.fn(() => JSON.stringify(state)),
      setItem: vi.fn((_key: string, _value: string) => undefined),
    }

    render(
      <ProgressProvider storage={storage}>
        <TopicPage
          getNow={() => clock}
          topicId="call-stack"
        />
      </ProgressProvider>,
    )

    clock = '2026-07-25T16:30:00.000Z'
    await user.click(screen.getByRole('button', { name: 'Источник изучен' }))

    expect(storage.setItem.mock.lastCall?.[1]).toContain(
      '"source":"2026-07-25T16:30:00.000Z"',
    )
  })

  it('schedules review from the self-check click time', async () => {
    const user = userEvent.setup()
    let clock = NOW
    const state = activeProgress('call-stack', {
      source: '2026-07-20T08:00:00.000Z',
      obsidian: '2026-07-20T09:00:00.000Z',
      anki: '2026-07-20T10:00:00.000Z',
      practice: '2026-07-20T11:00:00.000Z',
    })
    const storage = {
      getItem: vi.fn(() => JSON.stringify(state)),
      setItem: vi.fn((_key: string, _value: string) => undefined),
    }

    render(
      <ProgressProvider storage={storage}>
        <TopicPage
          getNow={() => clock}
          topicId="call-stack"
        />
      </ProgressProvider>,
    )

    const selfCheck = screen.getByRole('region', {
      name: 'Проверка понимания',
    })
    for (const checkbox of within(selfCheck).getAllByRole('checkbox')) {
      await user.click(checkbox)
    }

    clock = '2026-07-27T18:45:00.000Z'
    await user.click(
      within(selfCheck).getByRole('button', {
        name: 'Проверка пройдена',
      }),
    )

    expect(storage.setItem.mock.lastCall?.[1]).toContain(
      '"reviewDueAt":"2026-07-30T18:45:00.000Z"',
    )
  })
})
