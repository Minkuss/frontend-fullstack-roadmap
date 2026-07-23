import { describe, expect, it } from 'vitest'
import { createInitialProgress } from '../../domain/progress/progressReducer'
import type {
  ProgressState,
  TopicProgress,
  TopicStatus,
} from '../../domain/progress/types'
import type {
  RoadmapLane,
  RoadmapModule,
  Topic,
} from '../../domain/roadmap/types'
import {
  filterRoadmap,
  type RoadmapFilters,
} from './filterRoadmap'

function topic(
  id: string,
  title: string,
  estimatedMinutes: [number, number],
): Topic {
  return {
    id,
    title,
    outcome: 'Проверить фильтр.',
    whyNow: 'Тестовая тема.',
    priority: 'high',
    recommendationWeight: 50,
    estimatedMinutes,
    dependencies: [],
    sourceIds: { primary: 'source' },
    obsidianPrompts: ['Объясни тему.'],
    ankiPrompts: ['Вспомни тему.'],
    practice: [
      {
        id: `${id}-practice`,
        title: 'Практика',
        instructions: ['Сделай пример.'],
        minimumCompletion: 'Один пример.',
        estimatedMinutes: 10,
      },
    ],
    masteryChecks: ['Объяснить без заметки.'],
    quickSteps: ['Сделать короткий пример.'],
    sourceRefs: ['L0001'],
  }
}

function lane(
  id: string,
  title: string,
  modules: RoadmapModule[],
  kind: RoadmapLane['kind'] = 'primary-route',
): RoadmapLane {
  return {
    id,
    kind,
    order: 1,
    title,
    outcome: 'Тестовый маршрут.',
    modules,
    sourceRefs: ['L0001'],
  }
}

const statusTopics = [
  topic('new-topic', 'Новая тема', [10, 30]),
  topic('active-topic', 'Активная тема', [20, 30]),
  topic('paused-topic', 'Пауза', [31, 60]),
  topic('review-topic', 'Повторение', [45, 60]),
  topic('mastered-topic', 'Освоенная тема', [61, 90]),
]

const lanes: RoadmapLane[] = [
  lane('javascript-route', 'JavaScript route', [
    {
      id: 'async-module',
      title: 'Асинхронный JavaScript',
      outcome: 'Понять выполнение.',
      topics: statusTopics,
      sourceRefs: ['L0001'],
    },
  ]),
  lane('react-route', 'React route', [
    {
      id: 'react-module',
      title: 'React State',
      outcome: 'Понять состояние.',
      topics: [topic('react-state', 'Владение состоянием', [61, 120])],
      sourceRefs: ['L0001'],
    },
  ]),
  lane(
    'deferred-catalog',
    'Не сейчас',
    [
      {
        id: 'deferred-module',
        title: 'Отложенные инструменты',
        outcome: 'Вернуться позже.',
        topics: [topic('graphql', 'GraphQL', [20, 30])],
        sourceRefs: ['L0001'],
      },
    ],
    'deferred',
  ),
]

function progress(statuses: Record<string, TopicStatus>): ProgressState {
  const topics = Object.fromEntries(
    Object.entries(statuses).map(([id, status]) => [
      id,
      {
        status,
        completedSteps: {},
      } satisfies TopicProgress,
    ]),
  )

  return {
    ...createInitialProgress(),
    activeTopicId: statuses['active-topic'] ? 'active-topic' : null,
    topics,
  }
}

const state = progress({
  'active-topic': 'active',
  'paused-topic': 'paused',
  'review-topic': 'awaiting_review',
  'mastered-topic': 'mastered',
})

const DEFAULT_FILTERS: RoadmapFilters = {
  status: 'all',
  routeId: 'all',
  duration: 'all',
  query: '',
  includeDeferred: false,
}

function ids(filters: Partial<RoadmapFilters>) {
  return filterRoadmap(lanes, state, {
    ...DEFAULT_FILTERS,
    ...filters,
  }).flatMap((route) =>
    route.modules.flatMap((module) =>
      module.topics.map((candidate) => candidate.id),
    ),
  )
}

describe('filterRoadmap', () => {
  it.each([
    ['not_started', ['new-topic', 'react-state']],
    ['active', ['active-topic']],
    ['paused', ['paused-topic']],
    ['awaiting_review', ['review-topic']],
    ['mastered', ['mastered-topic']],
  ] satisfies Array<[TopicStatus, string[]]>)(
    'filters %s topics',
    (status, expected) => {
      expect(ids({ status })).toEqual(expected)
    },
  )

  it('filters one route without changing topic order', () => {
    expect(ids({ routeId: 'react-route' })).toEqual(['react-state'])
  })

  it.each([
    ['10-30', ['new-topic', 'active-topic']],
    ['31-60', ['paused-topic', 'review-topic']],
    ['61-plus', ['mastered-topic', 'react-state']],
  ] satisfies Array<[RoadmapFilters['duration'], string[]]>)(
    'uses the exact %s upper-estimate bucket',
    (duration, expected) => {
      expect(ids({ duration })).toEqual(expected)
    },
  )

  it('searches topic and module titles case-insensitively in Russian and English', () => {
    expect(ids({ query: 'НОВАЯ' })).toEqual(['new-topic'])
    expect(ids({ query: 'react STATE' })).toEqual(['react-state'])
    expect(ids({ query: 'асИнхРонНый' })).toEqual(
      statusTopics.map(({ id }) => id),
    )
  })

  it('keeps deferred topics hidden until «Не сейчас» is explicit', () => {
    expect(ids({ query: 'GraphQL' })).toEqual([])
    expect(ids({ query: 'GraphQL', includeDeferred: true })).toEqual([
      'graphql',
    ])
  })
})
