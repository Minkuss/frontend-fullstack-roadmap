import { describe, expect, it } from 'vitest'
import { buildRoadmapIndex, findTopic } from './buildRoadmapIndex'
import { validateRoadmap } from './validateRoadmap'

function createRoadmap() {
  return {
    contentVersion: 1,
    sources: [
      {
        id: 'mdn-event-loop',
        title: 'JavaScript event loop',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop',
        language: 'en',
        format: 'documentation',
        lastVerifiedAt: '2026-07-23',
      },
    ],
    routes: [createLane('frontend-model', 'primary-route', 'event-loop')],
    petProject: createLane('pet-project', 'pet-project'),
    background: createLane('background', 'background'),
    deferred: createLane('deferred', 'deferred'),
    metaSourceRefs: ['meta:priorities'],
  }
}

function createLane(id: string, kind: string, topicId = `${id}-topic`) {
  return {
    id,
    kind,
    order: 1,
    title: id,
    outcome: 'Complete this learning lane.',
    modules: [
      {
        id: `${id}-module`,
        title: 'A module',
        outcome: 'Complete this module.',
        topics: [
          {
            id: topicId,
            title: 'Event loop',
            outcome: 'Explain scheduling.',
            whyNow: 'It supports async JavaScript.',
            priority: 'critical',
            recommendationWeight: 100,
            estimatedMinutes: [30, 45],
            dependencies: [topicId],
            sourceIds: { primary: 'mdn-event-loop' },
            obsidianPrompts: ['Summarize scheduling.'],
            ankiPrompts: ['What runs first?'],
            practice: [
              {
                id: `${id}-practice`,
                title: 'Observe scheduling',
                instructions: ['Run a task and microtask example.'],
                minimumCompletion: 'Explain the output.',
                estimatedMinutes: 15,
              },
            ],
            masteryChecks: ['I can predict the queue order.'],
            quickSteps: ['Read the primary source.'],
            sourceRefs: ['list:event-loop'],
          },
        ],
        sourceRefs: ['heading:javascript'],
      },
    ],
    sourceRefs: ['heading:frontend'],
  }
}

describe('buildRoadmapIndex', () => {
  it('indexes topics with their route and module locations', () => {
    const roadmap = validateRoadmap(createRoadmap())
    const index = buildRoadmapIndex(roadmap)

    expect(findTopic(index, 'event-loop')).toMatchObject({ id: 'event-loop' })
  })

  it('throws for duplicate topic ids', () => {
    const duplicateTopicFixture = {
      ...createRoadmap(),
      petProject: createLane('pet-project', 'pet-project', 'event-loop'),
    }

    expect(() => buildRoadmapIndex(duplicateTopicFixture as never)).toThrow(
      'Duplicate topic id: event-loop',
    )
  })
})
