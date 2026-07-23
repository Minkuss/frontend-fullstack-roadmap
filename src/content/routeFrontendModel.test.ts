import { describe, expect, it } from 'vitest'

import inventoryJson from '../../content/source/inventory.json'
import routeJson from '../../content/roadmap/route-frontend-model.json'
import sourcesJson from '../../content/roadmap/sources.json'
import type {
  LearningSource,
  RoadmapLane,
  Topic,
  TopicPriority,
} from '../domain/roadmap/types'
import { validateLane } from '../domain/roadmap/validateRoadmap'

const VERIFIED_AT = '2026-07-23'
const includedSections = [
  '2.1.',
  '2.2.',
  '2.3.',
  '2.4.',
  '2.5.',
  '2.6.',
  '3.1.',
  '3.2.',
  '3.3.',
  '3.4.',
  '3.5.',
  '3.6.',
  '3.7.',
  '4.1.',
  '4.2.',
  '4.3.',
  '4.4.',
  '4.5.',
  '4.7.',
  '4.8.',
]

const sources = sourcesJson as LearningSource[]
const route = routeJson as RoadmapLane
const topics = route.modules.flatMap((module) => module.topics)
const sourceById = new Map(sources.map((source) => [source.id, source]))
const inventoryById = new Map(
  inventoryJson.items.map((item) => [item.id, item]),
)
const topicById = new Map(topics.map((topic) => [topic.id, topic]))
const allowedPriorities = new Set<TopicPriority>([
  'critical',
  'high',
  'supporting',
  'background',
  'deferred',
])
const criticalTopicIds = new Set([
  'call-stack',
  'closures',
  'functions-this',
  'promise-basics',
  'event-loop',
  'async-cancellation-races',
  'type-system',
  'narrowing',
  'generics',
  'react-render-commit',
  'react-state-model',
  'react-effects',
])
const highRiskTopicContracts = {
  'prototypes-classes': {
    section: '2.4.',
    sourceIds: {
      primary: 'javascript-info-prototype-inheritance',
      fallback: 'mdn-ru-classes',
      practice: 'mdn-en-using-classes',
    },
    sourceRefs: [
      'L0188',
      'L0192',
      'L0193',
      'L0194',
      'L0195',
      'L0196',
      'L0197',
      'L0198',
      'L0199',
      'L0200',
      'L0201',
      'L0202',
      'L0206',
      'L0207',
      'L0208',
      'L0209',
    ],
  },
  'async-cancellation-races': {
    section: '2.5.',
    sourceIds: {
      primary: 'javascript-info-fetch-abort',
      fallback: 'mdn-ru-abort-controller',
      practice: 'react-use-effect-race-condition',
    },
    sourceRefs: [
      'L0236',
      'L0237',
      'L0238',
      'L0251',
      'L0252',
      'L0261',
      'L0263',
    ],
  },
  'async-rate-control': {
    section: '2.5.',
    sourceIds: {
      primary: 'mdn-en-debounce',
      fallback: 'mdn-en-throttle',
    },
    sourceRefs: ['L0239', 'L0240', 'L0258', 'L0259'],
  },
  'async-retry-concurrency': {
    section: '2.5.',
    sourceIds: {
      primary: 'aws-retry-backoff',
      fallback: 'p-limit-readme',
    },
    sourceRefs: ['L0241', 'L0242', 'L0243', 'L0260', 'L0262'],
  },
  'keyed-collections': {
    section: '2.6.',
    sourceIds: {
      primary: 'javascript-info-map-set',
      fallback: 'javascript-info-weakmap-weakset',
    },
    sourceRefs: ['L0283', 'L0284', 'L0285', 'L0286', 'L0294', 'L0295'],
  },
  'iterables-generators': {
    section: '2.6.',
    sourceIds: {
      primary: 'javascript-info-iterable',
      fallback: 'javascript-info-generators',
    },
    sourceRefs: ['L0287', 'L0288', 'L0289'],
  },
  'react-composition': {
    section: '4.4.',
    sourceIds: {
      primary: 'react-passing-props',
      fallback: 'react-sharing-state',
      practice: 'react-custom-hooks',
    },
    sourceRefs: [
      'L0648',
      'L0652',
      'L0653',
      'L0654',
      'L0655',
      'L0656',
      'L0657',
      'L0658',
      'L0659',
      'L0660',
      'L0661',
      'L0665',
      'L0666',
      'L0667',
      'L0668',
      'L0669',
    ],
  },
  'react-error-boundaries': {
    section: '4.7.',
    sourceIds: {
      primary: 'react-error-boundary',
    },
    sourceRefs: [
      'L0740',
      'L0744',
      'L0745',
      'L0746',
      'L0747',
      'L0749',
      'L0760',
      'L0762',
    ],
  },
  'react-async-ui-states': {
    section: '4.7.',
    sourceIds: {
      primary: 'tanstack-query-states',
      fallback: 'tanstack-query-network-mode',
      practice: 'tanstack-query-important-defaults',
    },
    sourceRefs: [
      'L0750',
      'L0751',
      'L0752',
      'L0753',
      'L0754',
      'L0756',
      'L0763',
    ],
  },
  'react-retry-optimistic': {
    section: '4.7.',
    sourceIds: {
      primary: 'tanstack-query-retries',
      fallback: 'tanstack-query-optimistic-updates',
    },
    sourceRefs: ['L0748', 'L0755', 'L0761'],
  },
  'react-forms': {
    section: '4.8.',
    sourceIds: {
      primary: 'react-input-reference',
      fallback: 'react-hook-form-use-form',
      practice: 'react-hook-form-use-field-array',
    },
    sourceRefs: [
      'L0767',
      'L0771',
      'L0772',
      'L0773',
      'L0774',
      'L0775',
      'L0776',
      'L0777',
      'L0778',
      'L0779',
      'L0780',
      'L0781',
      'L0785',
      'L0786',
      'L0787',
      'L0791',
      'L0792',
      'L0793',
      'L0794',
      'L0795',
    ],
  },
} as const

function expectLearningCycle(topic: Topic) {
  expect(topic.outcome, topic.id).toMatch(
    /^(Объяснить|Предсказать|Различать|Применить|Спроектировать|Типизировать|Проверить|Настроить|Диагностировать|Выбрать|Реализовать|Преобразовать|Сопоставить|Разработать)/,
  )
  expect(topic.whyNow.trim().length, topic.id).toBeGreaterThan(20)
  expect(topic.estimatedMinutes, topic.id).toHaveLength(2)
  expect(topic.sourceIds.primary, topic.id).toBeTruthy()
  expect(topic.obsidianPrompts.length, topic.id).toBeGreaterThanOrEqual(2)
  expect(topic.obsidianPrompts.length, topic.id).toBeLessThanOrEqual(4)
  expect(topic.ankiPrompts.length, topic.id).toBeGreaterThanOrEqual(4)
  expect(topic.ankiPrompts.length, topic.id).toBeLessThanOrEqual(7)
  expect(topic.practice.length, topic.id).toBeGreaterThanOrEqual(1)
  expect(topic.practice[0].minimumCompletion.trim().length, topic.id).toBeGreaterThan(20)
  expect(topic.masteryChecks.length, topic.id).toBeGreaterThanOrEqual(3)
  expect(topic.masteryChecks.length, topic.id).toBeLessThanOrEqual(5)
  expect(topic.quickSteps.length, topic.id).toBeGreaterThanOrEqual(1)
  expect(topic.quickSteps.every((step) => /1[0-5] минут/.test(step)), topic.id).toBe(true)
}

describe('Route 1: frontend mental model', () => {
  it('is the first primary route with JavaScript, TypeScript, and React modules', () => {
    expect(route.kind).toBe('primary-route')
    expect(route.order).toBe(1)
    expect(route.modules.map((module) => module.id)).toEqual([
      'javascript',
      'typescript',
      'react',
    ])
  })

  it('is a valid independent lane and every topic has a complete learning cycle', () => {
    expect(validateLane(routeJson, sourcesJson as LearningSource[])).toEqual(route)
    topics.forEach(expectLearningCycle)
  })

  it('uses sources verified today and explains every English source', () => {
    expect(sources.length).toBeGreaterThan(0)
    expect(sourceById.size).toBe(sources.length)
    sources.forEach((source) => {
      expect(source.id.trim(), source.id).not.toBe('')
      expect(source.title.trim(), source.id).not.toBe('')
      expect(new URL(source.url).protocol, source.id).toBe('https:')
      expect(['ru', 'en'], source.id).toContain(source.language)
      expect(
        ['documentation', 'guide', 'article', 'course', 'video', 'exercise'],
        source.id,
      ).toContain(source.format)
      expect(source.lastVerifiedAt, source.id).toBe(VERIFIED_AT)
      expect(source.section, source.id).toMatch(/^[234]\.\d\.$/)
      expect(includedSections, source.id).toContain(source.section)
      if (source.language === 'en') {
        expect(source.englishReason?.trim().length, source.id).toBeGreaterThan(0)
      }
    })

    topics.forEach((topic) => {
      expect(sourceById.get(topic.sourceIds.primary), topic.id).toBeDefined()
    })
  })

  it('resolves every dependency inside the route', () => {
    const topicIds = new Set(topics.map((topic) => topic.id))
    topics.forEach((topic) => {
      topic.dependencies.forEach((dependency) => {
        expect(topicIds.has(dependency), `${topic.id} -> ${dependency}`).toBe(true)
      })
    })
  })

  it('maps high-risk topics to exact source sections, references, and source roles', () => {
    Object.entries(highRiskTopicContracts).forEach(([topicId, contract]) => {
      const topic = topicById.get(topicId)

      expect(topic, topicId).toBeDefined()
      expect(topic?.sourceIds, topicId).toEqual(contract.sourceIds)
      expect(topic?.sourceRefs, topicId).toEqual(contract.sourceRefs)

      Object.values(contract.sourceIds).forEach((sourceId) => {
        expect(sourceById.get(sourceId)?.section, `${topicId} -> ${sourceId}`).toBe(
          contract.section,
        )
      })

      contract.sourceRefs.forEach((sourceRef) => {
        expect(
          inventoryById.get(sourceRef)?.h2,
          `${topicId} -> ${sourceRef}`,
        ).toMatch(new RegExp(`^${contract.section.replaceAll('.', '\\.')}`))
      })
    })
  })

  it('keeps React composition children-based and controlled without unsupported compound terminology', () => {
    const topic = topicById.get('react-composition')
    const practiceText = topic?.practice
      .flatMap((task) => [
        task.title,
        ...task.instructions,
        task.minimumCompletion,
      ])
      .join(' ')
    const learningText = [
      topic?.outcome,
      ...(topic?.obsidianPrompts ?? []),
      ...(topic?.ankiPrompts ?? []),
      practiceText,
      ...(topic?.masteryChecks ?? []),
    ].join(' ')

    expect(topic, 'react-composition').toBeDefined()
    expect(learningText).not.toMatch(/\bcompound(?:-component)?\b/i)
    expect(topic?.outcome).toMatch(/children/)
    expect(topic?.outcome).toMatch(/controlled/)
    expect(practiceText).toMatch(/children/)
    expect(practiceText).toMatch(/controlled/)
    expect(topic?.dependencies).toEqual([
      'functions-this',
      'react-state-model',
      'react-typing',
    ])
  })

  it('uses explicit valid priorities and bounded integer recommendation weights', () => {
    topics.forEach((topic) => {
      expect(allowedPriorities.has(topic.priority), topic.id).toBe(true)
      expect(Number.isInteger(topic.recommendationWeight), topic.id).toBe(true)
      expect(topic.recommendationWeight, topic.id).toBeGreaterThanOrEqual(0)
      expect(topic.recommendationWeight, topic.id).toBeLessThanOrEqual(100)
      expect(topic.priority === 'critical', topic.id).toBe(
        criticalTopicIds.has(topic.id),
      )
    })
  })

  it('traces included source sections exactly and keeps production topics out', () => {
    const expectedRefs = inventoryJson.items
      .filter(
        (item) =>
          item.h2 !== null &&
          includedSections.some((section) => item.h2?.startsWith(section)),
      )
      .map((item) => item.id)
    const topicRefs = topics.flatMap((topic) => topic.sourceRefs)

    expect(new Set(topicRefs).size).toBe(topicRefs.length)
    expect(new Set(topicRefs)).toEqual(new Set(expectedRefs))

    topicRefs.forEach((ref) => {
      const item = inventoryById.get(ref)
      expect(item, ref).toBeDefined()
      expect(['2. JavaScript', '3. TypeScript', '4. React'], ref).toContain(item?.h1)
      expect(item?.h2, ref).not.toMatch(/^(2\.7\.|2\.8\.|4\.6\.)/)
    })
  })
})
