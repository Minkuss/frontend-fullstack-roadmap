import { describe, expect, it } from 'vitest'

import inventoryJson from '../../content/source/inventory.json'
import routeJson from '../../content/roadmap/route-frontend-model.json'
import sourcesJson from '../../content/roadmap/sources.json'
import type {
  LearningSource,
  RoadmapLane,
  Topic,
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
