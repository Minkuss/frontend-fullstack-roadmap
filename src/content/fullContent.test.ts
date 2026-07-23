import { describe, expect, it } from 'vitest'

import inventoryJson from '../../content/source/inventory.json'
import type { RoadmapLane, Topic } from '../domain/roadmap/types'
import { roadmap } from './loadRoadmap'

const inventoryById = new Map(
  inventoryJson.items.map((item) => [item.id, item]),
)
const allLanes = [
  ...roadmap.routes,
  roadmap.petProject,
  roadmap.background,
  roadmap.deferred,
]
const allTopics = allLanes.flatMap((lane) =>
  lane.modules.flatMap((module) => module.topics),
)

function expectRefsFrom(
  lane: RoadmapLane,
  accepted: (item: (typeof inventoryJson.items)[number]) => boolean,
) {
  const refs = [
    ...lane.sourceRefs,
    ...lane.modules.flatMap((module) => [
      ...module.sourceRefs,
      ...module.topics.flatMap((topic) => topic.sourceRefs),
    ]),
  ]

  refs.forEach((ref) => {
    const item = inventoryById.get(ref)
    expect(item, `${lane.id} references unknown inventory item ${ref}`).toBeDefined()
    expect(
      accepted(item!),
      `${lane.id} misallocates ${ref} from ${item?.h1} / ${item?.h2}`,
    ).toBe(true)
  })
}

function expectCompleteCycle(topic: Topic) {
  expect(topic.obsidianPrompts.length, `${topic.id}: Obsidian`).toBeGreaterThan(0)
  expect(topic.ankiPrompts.length, `${topic.id}: Anki`).toBeGreaterThan(0)
  expect(topic.practice.length, `${topic.id}: practice`).toBeGreaterThan(0)
  expect(topic.masteryChecks.length, `${topic.id}: mastery`).toBeGreaterThan(0)
  expect(topic.quickSteps.length, `${topic.id}: quick step`).toBeGreaterThan(0)
  expect(topic.sourceRefs.length, `${topic.id}: source refs`).toBeGreaterThan(0)
}

describe('complete roadmap content', () => {
  it('gives every source a useful external reading target instead of roadmap numbering', () => {
    expect(roadmap.sources).toHaveLength(205)

    roadmap.sources.forEach((source) => {
      expect(source.section?.trim().length, source.id).toBeGreaterThan(0)
      expect(source.section, source.id).not.toMatch(
        /^\d+(?:\.\d+)*\.?$/,
      )
    })
  })

  it('uses the fixed module order for production frontend', () => {
    expect(roadmap.routes[2].modules.map(({ id }) => id)).toEqual([
      'frontend-architecture',
      'modules-build',
      'performance-memory',
      'html-css-accessibility',
      'frontend-observability',
    ])
  })

  it('uses the fixed foundation-before-delivery order for fullstack delivery', () => {
    expect(roadmap.routes[3].modules.map(({ id }) => id)).toEqual([
      'node-fastify',
      'sql-postgresql',
      'docker',
      'reverse-proxy',
      'ci-cd',
      'backend-observability',
    ])
  })

  it('keeps supporting directions visible without making them primary routes', () => {
    expect(roadmap.petProject.modules.map(({ id }) => id)).toEqual([
      'pet-project-stack',
    ])
    expect(roadmap.background.modules.map(({ id }) => id)).toEqual([
      'git-teamwork',
      'code-review',
      'ai-agents',
      'technical-english',
      'algorithms-data-structures',
    ])
    expect(roadmap.deferred.title).toContain('Не сейчас')
    expect(roadmap.deferred.modules.map(({ id }) => id)).toEqual([
      'deferred-topics',
    ])
    roadmap.deferred.modules
      .flatMap((module) => module.topics)
      .forEach((topic) => {
        expect(topic.priority).toBe('deferred')
        expect(topic.recommendationWeight).toBe(0)
      })
  })

  it('gives every topic the complete read-note-Anki-practice-review cycle', () => {
    allTopics.forEach(expectCompleteCycle)
  })

  it('keeps production frontend references inside its fixed allocation', () => {
    expectRefsFrom(roadmap.routes[2], (item) => {
      if (item.h1 === '6. Архитектура frontend') return true
      if (item.h1 === '11. HTML, CSS и accessibility') return true
      if (
        item.h2 === '2.7. Модули и сборка' ||
        item.h2 === '2.8. Память и производительность' ||
        item.h2 === '4.6. Производительность React' ||
        item.h2 === 'Производительность'
      ) {
        return true
      }
      return (
        item.h1 === '17. Observability и production-диагностика' &&
        (item.kind === 'h1' ||
          item.h2 === 'Цель' ||
          item.h2 === 'Frontend' ||
          item.h2 === 'Практика')
      )
    })
  })

  it('keeps fullstack delivery references inside sections 12–17', () => {
    expectRefsFrom(roadmap.routes[3], (item) => {
      if (
        [
          '12. Node.js',
          '13. SQL и PostgreSQL',
          '14. Docker',
          '15. Caddy и nginx',
          '16. CI/CD',
        ].includes(item.h1 ?? '')
      ) {
        return true
      }
      return (
        item.h1 === '17. Observability и production-диагностика' &&
        (item.h2 === 'Цель' ||
          item.h2 === 'Backend' ||
          item.h2 === 'Практика')
      )
    })
  })

  it('contains the required production practice outcomes', () => {
    const practiceText = allTopics
      .flatMap((topic) => topic.practice)
      .flatMap((practice) => [
        practice.title,
        ...practice.instructions,
        practice.minimumCompletion,
      ])
      .join(' ')
      .toLowerCase()

    ;[
      'архитектур',
      '3 adr',
      'bundle',
      'long task',
      'утечк',
      'доступн',
      'lighthouse',
      'frontend-ошиб',
    ].forEach((needle) => expect(practiceText).toContain(needle))
  })

  it('uses only local or synthetic systems for security-sensitive delivery practice', () => {
    const sensitiveTopics = roadmap.routes[3].modules
      .flatMap((module) => module.topics)
      .filter((topic) =>
        /auth|security|docker|proxy|deploy|database|sql/i.test(
          `${topic.id} ${topic.title}`,
        ),
      )

    sensitiveTopics.forEach((topic) => {
      expect(
        topic.practice
          .flatMap((practice) => [
            ...practice.instructions,
            practice.minimumCompletion,
          ])
          .join(' ')
          .toLowerCase(),
        topic.id,
      ).toMatch(/локальн|синтетическ|тестов/)
    })
  })
})
