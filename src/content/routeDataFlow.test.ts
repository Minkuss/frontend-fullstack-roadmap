import { describe, expect, it } from 'vitest'

import routeOneJson from '../../content/roadmap/route-frontend-model.json'
import routeJson from '../../content/roadmap/route-data-flow.json'
import sourcesJson from '../../content/roadmap/sources.json'
import inventoryJson from '../../content/source/inventory.json'
import type {
  LearningSource,
  RoadmapLane,
  Topic,
  TopicPriority,
} from '../domain/roadmap/types'
import { validateLane } from '../domain/roadmap/validateRoadmap'

const VERIFIED_AT = '2026-07-23'
const sources = sourcesJson as LearningSource[]
const route = routeJson as RoadmapLane
const routeOne = routeOneJson as RoadmapLane
const topics = route.modules.flatMap((module) => module.topics)
const sourceById = new Map(sources.map((source) => [source.id, source]))
const inventoryById = new Map(
  inventoryJson.items.map((item) => [item.id, item]),
)
const topicById = new Map(topics.map((topic) => [topic.id, topic]))
const moduleById = new Map(route.modules.map((module) => [module.id, module]))
const allowedPriorities = new Set<TopicPriority>([
  'critical',
  'high',
  'supporting',
  'background',
  'deferred',
])
const criticalTopicIds = new Set([
  'http-request-lifecycle',
  'tanstack-query-basics',
  'frontend-auth-model',
  'testing-concepts',
])
const allocatedH1ByModule = {
  'http-network': '7. HTTP и сеть',
  'browser-platform': '8. Браузер',
  'server-state': '5. TanStack Query',
  'frontend-security': '9. Frontend-безопасность',
  'testing-stack': '10. Тестирование',
} as const
const allocatedSectionByModule = {
  'http-network': '7.',
  'browser-platform': '8.',
  'server-state': '5.',
  'frontend-security': '9.',
  'testing-stack': '10.',
} as const
const highRiskTopicContracts = {
  'http-request-lifecycle': {
    section: '7.',
    sourceIds: {
      primary: 'mdn-ru-http-overview',
      fallback: 'mdn-ru-url',
      practice: 'firefox-network-monitor',
    },
    sourceRefs: [
      'L0920',
      'L0924',
      'L0926',
      'L0927',
      'L0928',
      'L0929',
      'L0930',
      'L0931',
      'L0936',
      'L0937',
      'L0938',
      'L0960',
    ],
  },
  'http-cache-cors-credentials': {
    section: '7.',
    sourceIds: {
      primary: 'mdn-ru-http-caching',
      fallback: 'doka-cors',
      practice: 'mdn-ru-cache-control',
    },
    sourceRefs: [
      'L0939',
      'L0940',
      'L0941',
      'L0942',
      'L0943',
      'L0944',
      'L0945',
      'L0946',
      'L0964',
    ],
  },
  'tanstack-query-basics': {
    section: '5.',
    sourceIds: {
      primary: 'tanstack-query-v5-quick-start',
      fallback: 'tanstack-query-v5-queries',
      practice: 'tanstack-query-v5-query-keys',
    },
    sourceRefs: [
      'L0801',
      'L0805',
      'L0809',
      'L0810',
      'L0811',
      'L0812',
      'L0813',
      'L0834',
      'L0839',
      'L0840',
      'L0847',
    ],
  },
  'query-optimistic-updates': {
    section: '5.',
    sourceIds: {
      primary: 'tanstack-query-v5-optimistic-updates',
      fallback: 'tanstack-query-v5-mutations',
      practice: 'tanstack-query-v5-query-cancellation',
    },
    sourceRefs: [
      'L0814',
      'L0829',
      'L0830',
      'L0841',
      'L0842',
      'L0843',
      'L0844',
    ],
  },
  'frontend-threat-model-xss': {
    section: '9.',
    sourceIds: {
      primary: 'owasp-xss-prevention',
      fallback: 'mdn-ru-web-security',
      practice: 'portswigger-xss-labs',
    },
    sourceRefs: [
      'L1036',
      'L1040',
      'L1042',
      'L1043',
      'L1044',
      'L1045',
      'L1046',
      'L1047',
      'L1048',
      'L1049',
      'L1078',
    ],
  },
  'csrf-cookie-defense': {
    section: '9.',
    sourceIds: {
      primary: 'owasp-csrf-prevention',
      fallback: 'mdn-ru-set-cookie',
      practice: 'portswigger-csrf-labs',
    },
    sourceRefs: [
      'L1050',
      'L1051',
      'L1052',
      'L1053',
      'L1079',
    ],
  },
  vitest: {
    section: '10.2.',
    sourceIds: {
      primary: 'vitest-guide',
      fallback: 'vitest-mocking',
      practice: 'vitest-timers',
    },
  },
  'react-testing-library': {
    section: '10.3.',
    sourceIds: {
      primary: 'testing-library-queries',
      fallback: 'testing-library-user-event',
      practice: 'testing-library-react-example',
    },
  },
  msw: {
    section: '10.4.',
    sourceIds: {
      primary: 'msw-node-integration',
      fallback: 'msw-response-resolver',
      practice: 'msw-network-behavior',
    },
  },
  playwright: {
    section: '10.5.',
    sourceIds: {
      primary: 'playwright-best-practices',
      fallback: 'playwright-locators',
      practice: 'playwright-trace-viewer',
    },
  },
} as const

function expectLearningCycle(topic: Topic) {
  expect(topic.outcome, topic.id).toMatch(
    /^(Объяснить|Предсказать|Различать|Применить|Спроектировать|Проверить|Настроить|Диагностировать|Выбрать|Реализовать|Преобразовать|Сопоставить|Разработать)/,
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

function usedSourceIds(topic: Topic) {
  return Object.values(topic.sourceIds).filter(
    (sourceId): sourceId is string => sourceId !== undefined,
  )
}

describe('Route 2: reliable data flow', () => {
  it('is the second primary route with the five modules in exact order', () => {
    expect(route.id).toBe('data-flow')
    expect(route.kind).toBe('primary-route')
    expect(route.order).toBe(2)
    expect(route.modules.map(({ id }) => id)).toEqual([
      'http-network',
      'browser-platform',
      'server-state',
      'frontend-security',
      'testing-stack',
    ])
    expect(topics).toHaveLength(21)
  })

  it('is a valid lane and every topic has a complete, manageable learning cycle', () => {
    expect(validateLane(routeJson, sources)).toEqual(route)
    topics.forEach(expectLearningCycle)
  })

  it('orders testing as concepts, Vitest, RTL, MSW, then Playwright', () => {
    expect(
      moduleById.get('testing-stack')?.topics.map((topic) => topic.id),
    ).toEqual([
      'testing-concepts',
      'vitest',
      'react-testing-library',
      'msw',
      'playwright',
    ])
  })

  it('keeps dependencies resolvable and enforces the required learning order', () => {
    const routeOneTopicIds = routeOne.modules.flatMap((module) =>
      module.topics.map((topic) => topic.id),
    )
    const knownTopicIds = new Set([
      ...routeOneTopicIds,
      ...topics.map((topic) => topic.id),
    ])

    topics.forEach((topic) => {
      topic.dependencies.forEach((dependency) => {
        expect(knownTopicIds.has(dependency), `${topic.id} -> ${dependency}`).toBe(
          true,
        )
      })
    })

    expect(topicById.get('tanstack-query-basics')?.dependencies).toEqual([
      'promise-basics',
      'http-request-lifecycle',
    ])
    expect(topicById.get('query-optimistic-updates')?.dependencies).toContain(
      'query-cache-invalidation',
    )
    expect(topicById.get('csrf-cookie-defense')?.dependencies).toContain(
      'frontend-auth-model',
    )
    expect(topicById.get('react-testing-library')?.dependencies).toContain(
      'vitest',
    )
    expect(topicById.get('msw')?.dependencies).toContain(
      'react-testing-library',
    )
    expect(topicById.get('playwright')?.dependencies).toContain('msw')

    ;[
      ['query-cache-invalidation', 'query-optimistic-updates'],
      ['frontend-auth-model', 'csrf-cookie-defense'],
      ['testing-concepts', 'vitest'],
      ['vitest', 'react-testing-library'],
      ['react-testing-library', 'msw'],
      ['msw', 'playwright'],
    ].forEach(([prerequisite, dependent]) => {
      expect(
        topics.findIndex((topic) => topic.id === prerequisite),
        `${prerequisite} before ${dependent}`,
      ).toBeLessThan(topics.findIndex((topic) => topic.id === dependent))
    })
  })

  it('uses current scoped sources and exact roles for high-risk topics', () => {
    expect(sourceById.size).toBe(sources.length)

    route.modules.forEach((module) => {
      const expectedSection =
        allocatedSectionByModule[
          module.id as keyof typeof allocatedSectionByModule
        ]

      module.topics.forEach((topic) => {
        usedSourceIds(topic).forEach((sourceId) => {
          const source = sourceById.get(sourceId)
          expect(source, `${topic.id} -> ${sourceId}`).toBeDefined()
          expect(source?.lastVerifiedAt, sourceId).toBe(VERIFIED_AT)
          expect(source?.section, `${topic.id} -> ${sourceId}`).toMatch(
            new RegExp(`^${expectedSection.replaceAll('.', '\\.')}`),
          )
          if (source?.language === 'en') {
            expect(source.englishReason?.trim().length, sourceId).toBeGreaterThan(
              20,
            )
          }
        })
      })
    })

    Object.entries(highRiskTopicContracts).forEach(([topicId, contract]) => {
      const topic = topicById.get(topicId)
      expect(topic, topicId).toBeDefined()
      expect(topic?.sourceIds, topicId).toEqual(contract.sourceIds)

      if ('sourceRefs' in contract) {
        expect(topic?.sourceRefs, topicId).toEqual(contract.sourceRefs)
      }

      Object.values(contract.sourceIds).forEach((sourceId) => {
        expect(sourceById.get(sourceId)?.section, `${topicId} -> ${sourceId}`).toBe(
          contract.section,
        )
      })
    })
  })

  it('allocates every declared source-map item exactly once and excludes browser performance', () => {
    const expectedRefs = inventoryJson.items
      .filter((item) => {
        const allocatedH1 = Object.values(allocatedH1ByModule).includes(
          item.h1 as (typeof allocatedH1ByModule)[keyof typeof allocatedH1ByModule],
        )
        return (
          allocatedH1 &&
          item.h2 !== null &&
          !(
            item.h1 === '8. Браузер' &&
            item.h2 === 'Производительность'
          )
        )
      })
      .map((item) => item.id)
    const topicRefs = topics.flatMap((topic) => topic.sourceRefs)

    expect(new Set(topicRefs).size).toBe(topicRefs.length)
    expect(new Set(topicRefs)).toEqual(new Set(expectedRefs))
    expect(route.sourceRefs).toEqual([
      'L0918',
      'L0969',
      'L0799',
      'L1034',
      'L1093',
    ])

    route.modules.forEach((module) => {
      const expectedH1 =
        allocatedH1ByModule[module.id as keyof typeof allocatedH1ByModule]
      const expectedModuleRef = inventoryJson.items.find(
        (item) => item.kind === 'h1' && item.h1 === expectedH1,
      )?.id

      expect(module.sourceRefs, module.id).toEqual([expectedModuleRef])
      module.topics.flatMap((topic) => topic.sourceRefs).forEach((sourceRef) => {
        const item = inventoryById.get(sourceRef)
        expect(item?.h1, `${module.id} -> ${sourceRef}`).toBe(expectedH1)
        if (module.id === 'browser-platform') {
          expect(item?.h2, sourceRef).not.toBe('Производительность')
        }
      })
    })
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

  it('keeps security practice inside synthetic or official training environments', () => {
    const securityTopics = moduleById.get('frontend-security')?.topics ?? []

    securityTopics.forEach((topic) => {
      const practiceText = topic.practice
        .flatMap((practice) => [
          practice.title,
          ...practice.instructions,
          practice.minimumCompletion,
        ])
        .join(' ')

      expect(practiceText, topic.id).toMatch(/локальн|синтетическ|учебн/i)
      expect(practiceText, topic.id).not.toMatch(
        /атакуй|взломай|чуж(?:ой|ую|ие)|боев(?:ой|ую)|реальн(?:ый|ую) систем/i,
      )
    })
  })

  it('contains the required frontend-shaped practice work', () => {
    const practiceText = topics
      .flatMap((topic) =>
        topic.practice.flatMap((practice) => [
          practice.title,
          ...practice.instructions,
          practice.minimumCompletion,
        ]),
      )
      .join(' ')

    expect(practiceText).toMatch(/отмен[а-я]* запрос/i)
    expect(practiceText).toMatch(/устаревш(?:ий|его|ие) ответ/i)
    expect(practiceText).toMatch(/rollback|откат/i)
    expect(practiceText).toMatch(/DOM-поведен|поведени[ея] DOM/i)
    expect(practiceText).toMatch(/MSW.*(?:API|запрос)|мок.*API/i)
    expect(practiceText).toMatch(/user-flow|пользовательск(?:ий|ого) сценар/i)
  })
})
