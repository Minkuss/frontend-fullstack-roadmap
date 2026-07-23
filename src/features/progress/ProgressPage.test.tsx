import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressProvider } from '../../app/ProgressProvider'
import { roadmapIndex } from '../../content/loadRoadmap'
import { createInitialProgress } from '../../domain/progress/progressReducer'
import type {
  ProgressState,
  StudyStepId,
  TopicProgress,
} from '../../domain/progress/types'
import { ProgressPage } from './ProgressPage'

const STEPS: StudyStepId[] = [
  'source',
  'obsidian',
  'anki',
  'practice',
  'selfCheck',
  'firstReview',
]

function completedSteps(count: number) {
  return Object.fromEntries(
    STEPS.slice(0, count).map((step, index) => [
      step,
      `2026-07-${String(10 + index).padStart(2, '0')}T08:00:00.000Z`,
    ]),
  )
}

function topicProgress(
  status: TopicProgress['status'],
): TopicProgress {
  if (status === 'awaiting_review') {
    return {
      status,
      completedSteps: completedSteps(5),
      startedAt: '2026-07-10T08:00:00.000Z',
      reviewDueAt: '2026-07-17T08:00:00.000Z',
    }
  }

  if (status === 'mastered') {
    return {
      status,
      completedSteps: completedSteps(6),
      startedAt: '2026-07-10T08:00:00.000Z',
      reviewDueAt: '2026-07-17T08:00:00.000Z',
      masteredAt: '2026-07-18T08:00:00.000Z',
    }
  }

  return {
    status,
    completedSteps: {},
    startedAt: '2026-07-20T08:00:00.000Z',
  }
}

function renderProgress(state: ProgressState) {
  const storage = {
    getItem: () => JSON.stringify(state),
    setItem: () => undefined,
  }

  return render(
    <ProgressProvider storage={storage}>
      <ProgressPage />
    </ProgressProvider>,
  )
}

describe('ProgressPage', () => {
  it('separates active, paused, review, mastered, and history topics', () => {
    const state: ProgressState = {
      ...createInitialProgress(),
      activeTopicId: 'call-stack',
      topics: {
        'call-stack': topicProgress('active'),
        closures: topicProgress('paused'),
        'promise-basics': topicProgress('awaiting_review'),
        'event-loop': topicProgress('mastered'),
      },
      history: [
        {
          topicId: 'call-stack',
          type: 'started',
          at: '2026-07-20T08:00:00.000Z',
        },
        {
          topicId: 'event-loop',
          type: 'mastered',
          at: '2026-07-18T08:00:00.000Z',
        },
      ],
    }

    renderProgress(state)

    expect(
      within(
        screen.getByRole('region', { name: 'Текущая тема' }),
      ).getByRole('link', { name: /Выполнение кода/ }),
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByRole('region', { name: 'Приостановлено' }),
      ).getByRole('link', { name: /Замыкания/ }),
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByRole('region', {
          name: 'Ожидают первого повторения',
        }),
      ).getByRole('link', { name: /Promise и async\/await/ }),
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByRole('region', { name: 'Освоено' }),
      ).getByRole('link', { name: /Event loop/ }),
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByRole('region', { name: 'История' }),
      ).getByText(/Начата тема.*Выполнение кода/),
    ).toBeInTheDocument()
  })

  it('uses calm explanatory copy for every empty progress section', () => {
    renderProgress(createInitialProgress())

    expect(screen.getByText('Сейчас нет активной темы.')).toBeInTheDocument()
    expect(
      screen.getByText('Приостановленных тем пока нет.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Тем для первого повторения пока нет.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Освоенные темы появятся здесь.')).toBeInTheDocument()
    expect(
      screen.getByText('История начнётся с первого учебного шага.'),
    ).toBeInTheDocument()
  })

  it('summarizes modules with counts in words and never as knowledge percentages', () => {
    const state: ProgressState = {
      ...createInitialProgress(),
      activeTopicId: 'closures',
      topics: {
        'call-stack': topicProgress('mastered'),
        closures: topicProgress('active'),
      },
    }
    const javascript = roadmapIndex.modules.get('javascript')
    if (!javascript) {
      throw new Error('Expected the JavaScript module')
    }

    renderProgress(state)

    const moduleSummary = screen.getByRole('listitem', {
      name: /JavaScript: выполнение и данные/,
    })
    expect(moduleSummary).toHaveTextContent(
      `1 освоено · 1 в работе · ${javascript.topics.length - 2} впереди`,
    )
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/знани/i)).not.toBeInTheDocument()
  })
})
