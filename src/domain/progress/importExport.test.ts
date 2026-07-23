import { describe, expect, it } from 'vitest'
import { buildRoadmapIndex } from '../roadmap/buildRoadmapIndex'
import type {
  Roadmap,
  RoadmapLane,
  Topic,
} from '../roadmap/types'
import { createInitialProgress, progressReducer } from './progressReducer'
import {
  exportProgress,
  parseProgressImport,
} from './importExport'
import type { ProgressState } from './types'

function topic(id: string): Topic {
  return {
    id,
    title: id,
    outcome: 'Проверить импорт.',
    whyNow: 'Нужен для теста.',
    priority: 'high',
    recommendationWeight: 50,
    estimatedMinutes: [20, 30],
    dependencies: [],
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

const roadmap: Roadmap = {
  contentVersion: 1,
  sources: [],
  routes: [lane('route', 'primary-route', 1, [topic('known-topic')])],
  petProject: lane('pet-project', 'pet-project', 2),
  background: lane('background', 'background', 3),
  deferred: lane('deferred', 'deferred', 4),
  metaSourceRefs: [],
}
const index = buildRoadmapIndex(roadmap)

function activeState(topicId = 'known-topic'): ProgressState {
  return progressReducer(createInitialProgress(), {
    type: 'topic/activate',
    topicId,
    at: '2026-07-23T08:00:00.000Z',
  })
}

describe('progress import and export', () => {
  it('round-trips progress in the current backup envelope', () => {
    const state = activeState()

    const raw = exportProgress(state, '2026-07-23T10:30:00.000Z')

    expect(JSON.parse(raw)).toEqual({
      format: 'frontend-path-progress',
      exportedAt: '2026-07-23T10:30:00.000Z',
      progress: state,
    })
    expect(parseProgressImport(raw, index)).toEqual({
      ok: true,
      state,
      unknownTopicIds: [],
    })
  })

  it('rejects malformed JSON and the wrong envelope format', () => {
    expect(parseProgressImport('{broken', index)).toEqual({
      ok: false,
      reason: 'invalid-json',
    })
    expect(
      parseProgressImport(
        JSON.stringify({
          format: 'some-other-app',
          exportedAt: '2026-07-23T10:30:00.000Z',
          progress: createInitialProgress(),
        }),
        index,
      ),
    ).toEqual({
      ok: false,
      reason: 'invalid-format',
    })
    expect(
      parseProgressImport(
        JSON.stringify({
          format: 'frontend-path-progress',
          exportedAt: 'not-an-iso-timestamp',
          progress: createInitialProgress(),
        }),
        index,
      ),
    ).toEqual({
      ok: false,
      reason: 'invalid-format',
    })
  })

  it('rejects progress that violates the persistence invariants', () => {
    const invalidState = {
      ...createInitialProgress(),
      activeTopicId: 'known-topic',
    }

    expect(
      parseProgressImport(
        JSON.stringify({
          format: 'frontend-path-progress',
          exportedAt: '2026-07-23T10:30:00.000Z',
          progress: invalidState,
        }),
        index,
      ),
    ).toEqual({
      ok: false,
      reason: 'invalid-progress',
    })
  })

  it('reports every unknown topic reference once in stable order', () => {
    const state: ProgressState = {
      schemaVersion: 1,
      activeTopicId: 'unknown-active',
      queue: ['known-topic', 'unknown-queue'],
      topics: {
        'unknown-active': {
          status: 'active',
          completedSteps: {},
          startedAt: '2026-07-23T08:00:00.000Z',
        },
        'unknown-stored': {
          status: 'paused',
          completedSteps: {},
          startedAt: '2026-07-22T08:00:00.000Z',
        },
      },
      history: [
        {
          topicId: 'unknown-history',
          type: 'started',
          at: '2026-07-20T08:00:00.000Z',
        },
        {
          topicId: 'unknown-active',
          type: 'started',
          at: '2026-07-23T08:00:00.000Z',
        },
      ],
    }

    const result = parseProgressImport(
      exportProgress(state, '2026-07-23T10:30:00.000Z'),
      index,
    )

    expect(result).toEqual({
      ok: true,
      state,
      unknownTopicIds: [
        'unknown-active',
        'unknown-history',
        'unknown-queue',
        'unknown-stored',
      ],
    })
  })

  it('does not touch current progress until a valid result is dispatched', () => {
    const current = activeState()
    const before = structuredClone(current)

    const invalid = parseProgressImport('{broken', index)

    expect(invalid.ok).toBe(false)
    expect(current).toEqual(before)

    const replacement = createInitialProgress()
    const parsed = parseProgressImport(
      exportProgress(replacement, '2026-07-23T10:30:00.000Z'),
      index,
    )
    expect(current).toEqual(before)

    if (!parsed.ok) {
      throw new Error('Expected a valid import')
    }
    const replaced = progressReducer(current, {
      type: 'state/replace',
      state: parsed.state,
    })

    expect(replaced).toEqual(replacement)
    expect(current).toEqual(before)
  })

  it('requires callers to pass an explicit ISO export time', () => {
    expect(() => exportProgress(createInitialProgress(), 'tomorrow')).toThrow(
      'Invalid ISO timestamp: tomorrow',
    )
  })
})
