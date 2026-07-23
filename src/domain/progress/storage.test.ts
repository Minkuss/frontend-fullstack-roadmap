import { describe, expect, it } from 'vitest'
import { createInitialProgress, progressReducer } from './progressReducer'
import {
  PROGRESS_STORAGE_KEY,
  loadProgress,
  saveProgress,
} from './storage'

describe('progress storage', () => {
  it('loads a valid current-version state', () => {
    const state = progressReducer(createInitialProgress(), {
      type: 'topic/activate',
      topicId: 'event-loop',
      at: '2026-07-23T08:00:00.000Z',
    })
    const storage = {
      getItem: () => JSON.stringify(state),
    }

    expect(loadProgress(storage)).toEqual({ state })
  })

  it('treats missing storage as a clean first visit', () => {
    expect(loadProgress({ getItem: () => null })).toEqual({
      state: createInitialProgress(),
    })
  })

  it('recovers from malformed and structurally invalid data', () => {
    expect(loadProgress({ getItem: () => '{broken' })).toEqual({
      state: createInitialProgress(),
      warning: 'invalid',
    })
    expect(
      loadProgress({
        getItem: () =>
          JSON.stringify({
            ...createInitialProgress(),
            schemaVersion: 2,
          }),
      }),
    ).toEqual({
      state: createInitialProgress(),
      warning: 'invalid',
    })
  })

  it('rejects invalid progress timestamps and broken active-topic state', () => {
    const invalidTimestamp = {
      ...createInitialProgress(),
      activeTopicId: 'event-loop',
      topics: {
        'event-loop': {
          status: 'active',
          completedSteps: {},
          startedAt: 'yesterday',
        },
      },
    }
    const missingActiveTopic = {
      ...createInitialProgress(),
      activeTopicId: 'missing',
    }

    expect(
      loadProgress({ getItem: () => JSON.stringify(invalidTimestamp) }).warning,
    ).toBe('invalid')
    expect(
      loadProgress({ getItem: () => JSON.stringify(missingActiveTopic) })
        .warning,
    ).toBe('invalid')
  })

  it('rejects impossible status and completed-step combinations', () => {
    const fiveSteps = {
      source: '2026-07-23T08:00:00.000Z',
      obsidian: '2026-07-24T08:00:00.000Z',
      anki: '2026-07-25T08:00:00.000Z',
      practice: '2026-07-26T08:00:00.000Z',
      selfCheck: '2026-07-27T08:00:00.000Z',
    }
    const sixSteps = {
      ...fiveSteps,
      firstReview: '2026-07-30T08:00:00.000Z',
    }
    const invalidTopics = [
      {
        status: 'not_started',
        completedSteps: {
          source: '2026-07-23T08:00:00.000Z',
        },
      },
      {
        status: 'active',
        completedSteps: fiveSteps,
        startedAt: '2026-07-23T08:00:00.000Z',
      },
      {
        status: 'paused',
        completedSteps: fiveSteps,
        startedAt: '2026-07-23T08:00:00.000Z',
      },
      {
        status: 'paused',
        completedSteps: sixSteps,
        startedAt: '2026-07-23T08:00:00.000Z',
        reviewDueAt: '2026-07-30T08:00:00.000Z',
        masteredAt: '2026-07-30T08:00:00.000Z',
      },
    ]

    for (const topic of invalidTopics) {
      const state = {
        ...createInitialProgress(),
        activeTopicId: topic.status === 'active' ? 'event-loop' : null,
        topics: { 'event-loop': topic },
      }

      expect(
        loadProgress({ getItem: () => JSON.stringify(state) }).warning,
      ).toBe('invalid')
    }
  })

  it('round-trips a reactivated five-step topic after first review', () => {
    let state = progressReducer(createInitialProgress(), {
      type: 'topic/activate',
      topicId: 'event-loop',
      at: '2026-07-23T08:00:00.000Z',
    })
    const steps = ['source', 'obsidian', 'anki', 'practice', 'selfCheck'] as const
    for (const [index, step] of steps.entries()) {
      state = progressReducer(state, {
        type: 'topic/complete-step',
        topicId: 'event-loop',
        step,
        at: `2026-07-${String(23 + index).padStart(2, '0')}T08:00:00.000Z`,
      })
    }
    state = progressReducer(state, {
      type: 'topic/activate',
      topicId: 'event-loop',
      at: '2026-07-30T07:00:00.000Z',
    })
    state = progressReducer(state, {
      type: 'topic/complete-step',
      topicId: 'event-loop',
      step: 'firstReview',
      at: '2026-07-30T08:00:00.000Z',
    })

    let saved: string | null = null
    expect(
      saveProgress(
        {
          setItem: (_key, value) => {
            saved = value
          },
        },
        state,
      ),
    ).toEqual({ ok: true })
    expect(loadProgress({ getItem: () => saved })).toEqual({ state })
  })

  it('returns unavailable when storage cannot be read', () => {
    const result = loadProgress({
      getItem: () => {
        throw new Error('blocked')
      },
    })

    expect(result).toEqual({
      state: createInitialProgress(),
      warning: 'unavailable',
    })
  })

  it('saves progress under the stable key', () => {
    const writes: Array<[string, string]> = []
    const state = createInitialProgress()

    const result = saveProgress(
      {
        setItem: (key, value) => {
          writes.push([key, value])
        },
      },
      state,
    )

    expect(result).toEqual({ ok: true })
    expect(writes).toEqual([
      [PROGRESS_STORAGE_KEY, JSON.stringify(createInitialProgress())],
    ])
  })

  it('classifies quota failures separately from unavailable storage', () => {
    const quotaResult = saveProgress(
      {
        setItem: () => {
          throw new DOMException('full', 'QuotaExceededError')
        },
      },
      createInitialProgress(),
    )
    const unavailableResult = saveProgress(
      {
        setItem: () => {
          throw new Error('blocked')
        },
      },
      createInitialProgress(),
    )

    expect(quotaResult).toEqual({ ok: false, reason: 'quota' })
    expect(unavailableResult).toEqual({ ok: false, reason: 'unavailable' })
  })
})
