import { describe, expect, it } from 'vitest'
import type { LearningSource } from './types'
import { validateLane, validateRoadmap } from './validateRoadmap'

const source: LearningSource = {
  id: 'mdn-event-loop',
  title: 'JavaScript event loop',
  url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop',
  language: 'en',
  format: 'documentation',
  lastVerifiedAt: '2026-07-23',
}

function createTopic(
  overrides: Record<string, unknown> = {},
  practiceId = 'event-loop-practice',
) {
  return {
    id: 'event-loop',
    title: 'Event loop',
    outcome: 'Explain how tasks and microtasks are scheduled.',
    whyNow: 'It clarifies asynchronous JavaScript.',
    priority: 'critical',
    recommendationWeight: 100,
    estimatedMinutes: [30, 45],
    dependencies: ['event-loop'],
    sourceIds: {
      primary: 'mdn-event-loop',
    },
    obsidianPrompts: ['Summarize the event loop.'],
    ankiPrompts: ['What runs before the next task?'],
    practice: [
      {
        id: practiceId,
        title: 'Log the queue order',
        instructions: ['Predict and then run a scheduling example.'],
        minimumCompletion: 'Explain the output order.',
        estimatedMinutes: 15,
      },
    ],
    masteryChecks: ['I can predict a simple queue order.'],
    quickSteps: ['Read the primary source.'],
    sourceRefs: ['list:javascript:event-loop'],
    ...overrides,
  }
}

function createLane(
  overrides: Record<string, unknown> = {},
  topicId = 'event-loop',
  practiceId = `${topicId}-practice`,
) {
  const laneId = typeof overrides.id === 'string' ? overrides.id : 'frontend-model'

  return {
    id: 'frontend-model',
    kind: 'primary-route',
    order: 1,
    title: 'Frontend model',
    outcome: 'Understand the browser execution model.',
    modules: [
      {
        id: `${laneId}-module`,
        title: 'JavaScript runtime',
        outcome: 'Understand JavaScript scheduling.',
        topics: [createTopic({ id: topicId, dependencies: [topicId] }, practiceId)],
        sourceRefs: ['heading:javascript'],
      },
    ],
    sourceRefs: ['heading:frontend'],
    ...overrides,
  }
}

function createRoadmap(overrides: Record<string, unknown> = {}) {
  return {
    contentVersion: 1,
    sources: [source],
    routes: [createLane()],
    petProject: createLane(
      { id: 'pet-project', kind: 'pet-project', order: 1 },
      'pet-project-topic',
    ),
    background: createLane(
      { id: 'background', kind: 'background', order: 1 },
      'background-topic',
    ),
    deferred: createLane(
      { id: 'deferred', kind: 'deferred', order: 1 },
      'deferred-topic',
    ),
    metaSourceRefs: ['meta:priorities'],
    ...overrides,
  }
}

describe('validateRoadmap', () => {
  it('returns a typed complete roadmap fixture', () => {
    expect(validateRoadmap(createRoadmap()).routes[0].modules[0].topics[0].id).toBe(
      'event-loop',
    )
  })

  it('requires at least one source', () => {
    expect(() => validateRoadmap({ routes: [] })).toThrow(
      'Roadmap.sources must contain at least one source',
    )
  })

  it('rejects a non-HTTPS learning source URL', () => {
    expect(() =>
      validateRoadmap(createRoadmap({ sources: [{ ...source, url: 'http://example.com' }] })),
    ).toThrow('Roadmap.sources[0].url must be an HTTPS URL')
  })

  it('rejects a source URL without a host', () => {
    expect(() =>
      validateRoadmap(createRoadmap({ sources: [{ ...source, url: 'https://' }] })),
    ).toThrow('Roadmap.sources[0].url must be an HTTPS URL')
  })

  it('rejects an impossible source verification date', () => {
    expect(() =>
      validateRoadmap(
        createRoadmap({ sources: [{ ...source, lastVerifiedAt: '2026-02-31' }] }),
      ),
    ).toThrow('Roadmap.sources[0].lastVerifiedAt must be an ISO date')
  })

  it('rejects a topic primary source that does not exist', () => {
    expect(() =>
      validateRoadmap(
        createRoadmap({
          routes: [
            createLane({
              modules: [
                {
                  id: 'javascript-runtime',
                  title: 'JavaScript runtime',
                  outcome: 'Understand JavaScript scheduling.',
                  topics: [createTopic({ sourceIds: { primary: 'missing' } })],
                  sourceRefs: ['heading:javascript'],
                },
              ],
            }),
          ],
        }),
      ),
    ).toThrow('Roadmap.routes[0].modules[0].topics[0].sourceIds.primary references unknown source: missing')
  })

  it('rejects empty learning steps', () => {
    expect(() =>
      validateRoadmap(
        createRoadmap({
          routes: [
            createLane({
              modules: [
                {
                  id: 'javascript-runtime',
                  title: 'JavaScript runtime',
                  outcome: 'Understand JavaScript scheduling.',
                  topics: [createTopic({ quickSteps: [] })],
                  sourceRefs: ['heading:javascript'],
                },
              ],
            }),
          ],
        }),
      ),
    ).toThrow('Roadmap.routes[0].modules[0].topics[0].quickSteps must contain at least one item')
  })

  it('rejects practice task IDs duplicated across topics', () => {
    expect(() =>
      validateRoadmap(
        createRoadmap({
          background: createLane(
            { id: 'background', kind: 'background', order: 1 },
            'background-topic',
            'event-loop-practice',
          ),
        }),
      ),
    ).toThrow('Duplicate practice task id: event-loop-practice')
  })

  it('validates a lane against its sources without a full roadmap', () => {
    expect(validateLane(createLane(), [source]).id).toBe('frontend-model')
  })
})
