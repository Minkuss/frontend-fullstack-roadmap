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

  it('recovers from missing, malformed, and structurally invalid data', () => {
    expect(loadProgress({ getItem: () => null })).toEqual({
      state: createInitialProgress(),
      warning: 'invalid',
    })
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
