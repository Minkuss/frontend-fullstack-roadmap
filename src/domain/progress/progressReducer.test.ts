import { describe, expect, it } from 'vitest'
import {
  ProgressDomainError,
  createInitialProgress,
  progressReducer,
} from './progressReducer'
import type { ProgressState, StudyStepId } from './types'

const STEP_ORDER: StudyStepId[] = [
  'source',
  'obsidian',
  'anki',
  'practice',
  'selfCheck',
  'firstReview',
]

function activate(
  state: ProgressState,
  topicId: string,
  at = '2026-07-23T08:00:00.000Z',
) {
  return progressReducer(state, { type: 'topic/activate', topicId, at })
}

function completeThrough(
  state: ProgressState,
  topicId: string,
  finalStep: StudyStepId,
) {
  const finalIndex = STEP_ORDER.indexOf(finalStep)

  return STEP_ORDER.slice(0, finalIndex + 1).reduce(
    (current, step, index) =>
      progressReducer(current, {
        type: 'topic/complete-step',
        topicId,
        step,
        at: `2026-07-${String(23 + index).padStart(2, '0')}T08:00:00.000Z`,
      }),
    state,
  )
}

describe('progressReducer', () => {
  it('creates an empty current-version state', () => {
    expect(createInitialProgress()).toEqual({
      schemaVersion: 1,
      activeTopicId: null,
      queue: [],
      topics: {},
      history: [],
    })
  })

  it('activating B pauses active A and preserves A progress', () => {
    const initial = createInitialProgress()
    const withA = activate(initial, 'topic-a')
    const withASource = progressReducer(withA, {
      type: 'topic/complete-step',
      topicId: 'topic-a',
      step: 'source',
      at: '2026-07-23T09:00:00.000Z',
    })

    const result = activate(
      withASource,
      'topic-b',
      '2026-07-24T08:00:00.000Z',
    )

    expect(result.activeTopicId).toBe('topic-b')
    expect(result.topics['topic-a']).toMatchObject({
      status: 'paused',
      completedSteps: { source: '2026-07-23T09:00:00.000Z' },
      startedAt: '2026-07-23T08:00:00.000Z',
    })
    expect(result.topics['topic-b']).toMatchObject({
      status: 'active',
      startedAt: '2026-07-24T08:00:00.000Z',
    })
    expect(result.history.slice(-2)).toEqual([
      {
        topicId: 'topic-a',
        type: 'paused',
        at: '2026-07-24T08:00:00.000Z',
      },
      {
        topicId: 'topic-b',
        type: 'started',
        at: '2026-07-24T08:00:00.000Z',
      },
    ])
    expect(withASource.topics['topic-a']?.status).toBe('active')
  })

  it('does not create duplicate history when activating the current topic', () => {
    const active = activate(createInitialProgress(), 'topic-a')

    const result = activate(active, 'topic-a', '2026-07-24T08:00:00.000Z')

    expect(result).toBe(active)
    expect(result.history).toHaveLength(1)
  })

  it('records the first start time for a stored not-started topic', () => {
    const state: ProgressState = {
      ...createInitialProgress(),
      topics: {
        'topic-a': {
          status: 'not_started',
          completedSteps: {},
        },
      },
    }

    const result = activate(state, 'topic-a')

    expect(result.topics['topic-a']?.startedAt).toBe(
      '2026-07-23T08:00:00.000Z',
    )
  })

  it('completing self-check schedules review exactly three days later', () => {
    const active = activate(
      createInitialProgress(),
      'event-loop',
      '2026-07-20T08:00:00.000Z',
    )

    const result = completeThrough(active, 'event-loop', 'selfCheck')

    expect(result.topics['event-loop']).toMatchObject({
      status: 'awaiting_review',
      reviewDueAt: '2026-07-30T08:00:00.000Z',
      completedSteps: {
        selfCheck: '2026-07-27T08:00:00.000Z',
      },
    })
    expect(result.activeTopicId).toBeNull()
  })

  it('completing first review masters the topic and clears active focus', () => {
    const active = activate(createInitialProgress(), 'event-loop')
    const awaitingReview = completeThrough(active, 'event-loop', 'selfCheck')
    const result = progressReducer(
      {
        ...awaitingReview,
        activeTopicId: 'event-loop',
      },
      {
        type: 'topic/complete-step',
        topicId: 'event-loop',
        step: 'firstReview',
        at: '2026-08-01T08:00:00.000Z',
      },
    )

    expect(result.activeTopicId).toBeNull()
    expect(result.topics['event-loop']).toMatchObject({
      status: 'mastered',
      masteredAt: '2026-08-01T08:00:00.000Z',
      completedSteps: {
        firstReview: '2026-08-01T08:00:00.000Z',
      },
    })
    expect(result.history.slice(-2).map(({ type }) => type)).toEqual([
      'step-completed',
      'mastered',
    ])
  })

  it('deduplicates the queue and removes topics when mastered', () => {
    const queuedOnce = progressReducer(createInitialProgress(), {
      type: 'queue/add',
      topicId: 'event-loop',
    })
    const queuedTwice = progressReducer(queuedOnce, {
      type: 'queue/add',
      topicId: 'event-loop',
    })
    const active = activate(queuedTwice, 'event-loop')
    const awaitingReview = completeThrough(active, 'event-loop', 'selfCheck')
    const mastered = progressReducer(awaitingReview, {
      type: 'topic/complete-step',
      topicId: 'event-loop',
      step: 'firstReview',
      at: '2026-08-01T08:00:00.000Z',
    })
    const requeued = progressReducer(mastered, {
      type: 'queue/add',
      topicId: 'event-loop',
    })

    expect(queuedTwice.queue).toEqual(['event-loop'])
    expect(active.queue).toEqual([])
    expect(mastered.queue).toEqual([])
    expect(requeued).toBe(mastered)
  })

  it('removes a queued topic without affecting other items', () => {
    const withA = progressReducer(createInitialProgress(), {
      type: 'queue/add',
      topicId: 'topic-a',
    })
    const withBoth = progressReducer(withA, {
      type: 'queue/add',
      topicId: 'topic-b',
    })

    const result = progressReducer(withBoth, {
      type: 'queue/remove',
      topicId: 'topic-a',
    })

    expect(result.queue).toEqual(['topic-b'])
  })

  it('viewing an unknown topic does not create progress', () => {
    const state = createInitialProgress()

    expect(state.topics['only-viewed']).toBeUndefined()
    expect(state).toEqual(createInitialProgress())
  })

  it('throws a domain error when a step is completed out of order', () => {
    const state = activate(createInitialProgress(), 'event-loop')

    expect(() =>
      progressReducer(state, {
        type: 'topic/complete-step',
        topicId: 'event-loop',
        step: 'anki',
        at: '2026-07-23T09:00:00.000Z',
      }),
    ).toThrow(ProgressDomainError)
  })

  it('rejects step completion for missing, paused, and mastered topics', () => {
    const initial = createInitialProgress()
    expect(() =>
      progressReducer(initial, {
        type: 'topic/complete-step',
        topicId: 'missing',
        step: 'source',
        at: '2026-07-23T09:00:00.000Z',
      }),
    ).toThrow('Topic is not started: missing')

    const withA = activate(initial, 'topic-a')
    const withB = activate(withA, 'topic-b')
    expect(() =>
      progressReducer(withB, {
        type: 'topic/complete-step',
        topicId: 'topic-a',
        step: 'source',
        at: '2026-07-24T09:00:00.000Z',
      }),
    ).toThrow('Topic is not active: topic-a')

    const awaitingReview = completeThrough(withB, 'topic-b', 'selfCheck')
    const mastered = progressReducer(awaitingReview, {
      type: 'topic/complete-step',
      topicId: 'topic-b',
      step: 'firstReview',
      at: '2026-08-01T08:00:00.000Z',
    })
    expect(() =>
      progressReducer(mastered, {
        type: 'topic/complete-step',
        topicId: 'topic-b',
        step: 'firstReview',
        at: '2026-08-02T08:00:00.000Z',
      }),
    ).toThrow('Topic is already mastered: topic-b')
  })

  it('rejects a duplicate step completion instead of overwriting its time', () => {
    const active = activate(createInitialProgress(), 'event-loop')
    const withSource = progressReducer(active, {
      type: 'topic/complete-step',
      topicId: 'event-loop',
      step: 'source',
      at: '2026-07-23T09:00:00.000Z',
    })

    expect(() =>
      progressReducer(withSource, {
        type: 'topic/complete-step',
        topicId: 'event-loop',
        step: 'source',
        at: '2026-07-24T09:00:00.000Z',
      }),
    ).toThrow('Step already completed: source')
    expect(withSource.topics['event-loop']?.completedSteps.source).toBe(
      '2026-07-23T09:00:00.000Z',
    )
  })

  it('rejects activation of a mastered topic and invalid timestamps', () => {
    const active = activate(createInitialProgress(), 'event-loop')
    const awaitingReview = completeThrough(active, 'event-loop', 'selfCheck')
    const mastered = progressReducer(awaitingReview, {
      type: 'topic/complete-step',
      topicId: 'event-loop',
      step: 'firstReview',
      at: '2026-08-01T08:00:00.000Z',
    })

    expect(() =>
      activate(mastered, 'event-loop', '2026-08-02T08:00:00.000Z'),
    ).toThrow('Topic is already mastered: event-loop')
    expect(() =>
      activate(createInitialProgress(), 'event-loop', 'not-a-date'),
    ).toThrow('Invalid timestamp: not-a-date')
  })

  it('sets an Obsidian URL only for an existing topic', () => {
    const active = activate(createInitialProgress(), 'event-loop')
    const result = progressReducer(active, {
      type: 'topic/set-obsidian-url',
      topicId: 'event-loop',
      url: 'obsidian://open?vault=brain&file=event-loop',
    })

    expect(result.topics['event-loop']?.obsidianUrl).toBe(
      'obsidian://open?vault=brain&file=event-loop',
    )
    expect(() =>
      progressReducer(createInitialProgress(), {
        type: 'topic/set-obsidian-url',
        topicId: 'missing',
        url: 'obsidian://open?vault=brain&file=missing',
      }),
    ).toThrow('Topic is not started: missing')
  })

  it('replaces and resets the whole state explicitly', () => {
    const replacement = activate(createInitialProgress(), 'event-loop')

    expect(
      progressReducer(createInitialProgress(), {
        type: 'state/replace',
        state: replacement,
      }),
    ).toBe(replacement)
    expect(
      progressReducer(replacement, {
        type: 'state/reset',
      }),
    ).toEqual(createInitialProgress())
  })
})
