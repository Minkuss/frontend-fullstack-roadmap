import { describe, expect, it } from 'vitest'
import { buildRoadmapIndex } from '../roadmap/buildRoadmapIndex'
import type {
  Roadmap,
  RoadmapLane,
  Topic,
} from '../roadmap/types'
import type {
  ProgressState,
  TopicProgress,
} from '../progress/types'
import { createInitialProgress } from '../progress/progressReducer'
import { selectFocus } from './selectFocus'

function topic(
  id: string,
  recommendationWeight: number,
  dependencies: string[] = [],
): Topic {
  return {
    id,
    title: id,
    outcome: 'Выбрать тему.',
    whyNow: 'Нужна для теста.',
    priority: recommendationWeight === 0 ? 'deferred' : 'high',
    recommendationWeight,
    estimatedMinutes: [20, 30],
    dependencies,
    sourceIds: { primary: 'source' },
    obsidianPrompts: ['Объясни тему.'],
    ankiPrompts: ['Вспомни определение.'],
    practice: [
      {
        id: `${id}-practice`,
        title: 'Практика',
        instructions: ['Выполни пример.'],
        minimumCompletion: 'Один пример.',
        estimatedMinutes: 10,
      },
    ],
    masteryChecks: ['Объяснить без заметки.'],
    quickSteps: ['Решить короткий пример.'],
    sourceRefs: ['L0001'],
  }
}

function lane(
  id: string,
  kind: RoadmapLane['kind'],
  order: number,
  topics: Topic[] = [],
): RoadmapLane {
  return {
    id,
    kind,
    order,
    title: id,
    outcome: 'Тестовый маршрут.',
    modules: topics.length
      ? [
          {
            id: `${id}-module`,
            title: 'Модуль',
            outcome: 'Тестовый модуль.',
            topics,
            sourceRefs: ['L0001'],
          },
        ]
      : [],
    sourceRefs: ['L0001'],
  }
}

const fourTopics = [
  topic('foundation', 40),
  topic('priority-a', 90, ['foundation']),
  topic('priority-b', 90, ['foundation']),
  topic('low-priority', 20),
]
const roadmap: Roadmap = {
  contentVersion: 1,
  sources: [],
  routes: [lane('route-one', 'primary-route', 1, fourTopics)],
  petProject: lane('pet-project', 'pet-project', 5),
  background: lane('background', 'background', 6),
  deferred: lane('deferred', 'deferred', 7),
  metaSourceRefs: [],
}
const index = buildRoadmapIndex(roadmap)
const now = '2026-07-23T12:00:00.000Z'

function progress(
  topics: Record<string, TopicProgress> = {},
  overrides: Partial<ProgressState> = {},
): ProgressState {
  return {
    ...createInitialProgress(),
    topics,
    ...overrides,
  }
}

function mastered(): TopicProgress {
  return {
    status: 'mastered',
    completedSteps: {
      source: '2026-07-01T08:00:00.000Z',
      obsidian: '2026-07-02T08:00:00.000Z',
      anki: '2026-07-03T08:00:00.000Z',
      practice: '2026-07-04T08:00:00.000Z',
      selfCheck: '2026-07-05T08:00:00.000Z',
      firstReview: '2026-07-08T08:00:00.000Z',
    },
    startedAt: '2026-07-01T08:00:00.000Z',
    reviewDueAt: '2026-07-08T08:00:00.000Z',
    masteredAt: '2026-07-08T08:00:00.000Z',
  }
}

function awaitingReview(
  reviewDueAt = '2026-07-23T08:00:00.000Z',
): TopicProgress {
  return {
    status: 'awaiting_review',
    completedSteps: {
      source: '2026-07-17T08:00:00.000Z',
      obsidian: '2026-07-18T08:00:00.000Z',
      anki: '2026-07-19T08:00:00.000Z',
      practice: '2026-07-20T08:00:00.000Z',
      selfCheck: '2026-07-20T08:00:00.000Z',
    },
    startedAt: '2026-07-17T08:00:00.000Z',
    reviewDueAt,
  }
}

describe('selectFocus', () => {
  it('keeps the existing active topic before every other candidate', () => {
    const state = progress(
      {
        'priority-a': {
          status: 'active',
          completedSteps: {},
          startedAt: '2026-07-23T08:00:00.000Z',
        },
      },
      {
        activeTopicId: 'priority-a',
        queue: ['low-priority'],
      },
    )

    expect(selectFocus(roadmap, index, state, now)).toMatchObject({
      topicId: 'priority-a',
      reason: 'active',
      missingDependencies: ['foundation'],
    })
  })

  it('uses the first queued study topic and skips mastered entries', () => {
    const state = progress(
      {
        foundation: mastered(),
      },
      {
        queue: ['foundation', 'priority-b', 'priority-a'],
      },
    )

    expect(selectFocus(roadmap, index, state, now)).toMatchObject({
      topicId: 'priority-b',
      reason: 'queue',
      missingDependencies: [],
    })
  })

  it('chooses the highest available weight, then roadmap order', () => {
    const state = progress({ foundation: mastered() })

    const result = selectFocus(roadmap, index, state, now)

    expect(result).toMatchObject({
      topicId: 'priority-a',
      reason: 'recommended',
      missingDependencies: [],
    })
    expect(result.nextTopicIds).toEqual([
      'priority-b',
      'low-priority',
    ])
  })

  it('falls back to the first remaining topic with prerequisite warnings', () => {
    const state = progress({
      foundation: awaitingReview('2026-07-30T08:00:00.000Z'),
      'low-priority': awaitingReview('2026-07-30T08:00:00.000Z'),
    })

    expect(selectFocus(roadmap, index, state, now)).toMatchObject({
      topicId: 'priority-a',
      reason: 'missing-prerequisites',
      missingDependencies: ['foundation'],
    })
  })

  it('shows due reviews separately without replacing study focus', () => {
    const state = progress({
      foundation: awaitingReview(),
    })

    expect(selectFocus(roadmap, index, state, now)).toMatchObject({
      topicId: 'low-priority',
      reason: 'recommended',
      dueReviewTopicIds: ['foundation'],
    })
  })

  it('limits deterministic next topics to three', () => {
    const result = selectFocus(roadmap, index, createInitialProgress(), now)

    expect(result).toMatchObject({
      topicId: 'foundation',
      reason: 'recommended',
      nextTopicIds: ['low-priority', 'priority-a', 'priority-b'],
    })
    expect(result.nextTopicIds).toHaveLength(3)
  })

  it('returns complete when no study topic remains', () => {
    const state = progress(
      Object.fromEntries(fourTopics.map(({ id }) => [id, mastered()])),
    )

    expect(selectFocus(roadmap, index, state, now)).toEqual({
      topicId: null,
      reason: 'complete',
      nextTopicIds: [],
      dueReviewTopicIds: [],
      missingDependencies: [],
    })
  })

  it('never auto-focuses deferred lanes or zero-weight topics', () => {
    const deferredTopic = topic('not-now', 0)
    const deferredRoadmap: Roadmap = {
      ...roadmap,
      routes: [],
      deferred: lane('deferred-only', 'deferred', 1, [deferredTopic]),
    }
    const deferredIndex = buildRoadmapIndex(deferredRoadmap)
    const state = progress({}, { queue: ['not-now'] })

    expect(
      selectFocus(deferredRoadmap, deferredIndex, state, now),
    ).toEqual({
      topicId: null,
      reason: 'complete',
      nextTopicIds: [],
      dueReviewTopicIds: [],
      missingDependencies: [],
    })
  })

  it('uses the explicit ISO time and rejects invalid values', () => {
    const state = progress({
      foundation: awaitingReview('2026-07-24T08:00:00.000Z'),
    })

    expect(
      selectFocus(roadmap, index, state, '2026-07-23T12:00:00.000Z')
        .dueReviewTopicIds,
    ).toEqual([])
    expect(
      selectFocus(roadmap, index, state, '2026-07-24T12:00:00.000Z')
        .dueReviewTopicIds,
    ).toEqual(['foundation'])
    expect(() =>
      selectFocus(roadmap, index, state, 'not-a-date'),
    ).toThrow('Invalid ISO timestamp: not-a-date')
  })
})
