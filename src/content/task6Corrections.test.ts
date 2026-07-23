import { describe, expect, it } from 'vitest'

import type { Topic } from '../domain/roadmap/types'
import { roadmap, roadmapIndex } from './loadRoadmap'

const migratedSourceIds = [
  'fsd-overview-ru',
  'fsd-public-api-ru',
  'vite-features',
  'rollup-tree-shaking',
  'chrome-memory-problems',
  'chrome-performance',
  'react-profiler',
  'webdev-core-web-vitals',
  'mdn-ru-html-structure',
  'mdn-ru-css-layout',
  'webdev-accessibility',
  'wai-forms-tutorial',
  'sentry-react',
  'node-introduction',
  'node-event-loop',
  'fastify-getting-started',
  'fastify-validation',
  'owasp-password-storage',
  'owasp-authorization',
  'postgrespro-tutorial',
  'postgrespro-indexes',
  'postgres-explain',
  'docker-build-best-practices',
  'docker-compose',
  'docker-security',
  'caddy-reverse-proxy',
  'caddy-file-server',
  'github-actions-understand',
  'github-actions-deployments',
  'fastify-logging',
  'git-book-ru',
  'google-code-review',
  'openai-agents-md',
  'google-technical-writing',
  'yandex-algorithms',
  'kubernetes-basics',
  'graphql-learn',
  'webpack-module-federation',
  'mdn-ru-webassembly-concepts',
] as const

const originalMapSectionLabels = new Set([
  '2.7. Модули и сборка',
  '2.8. Память и производительность',
  '4.6. Производительность React',
  '6. Архитектура frontend',
  '8. Производительность',
  '11. HTML',
  '11. CSS',
  '11. Accessibility',
  '11. HTML и Accessibility',
  '12. Основы Node.js',
  '12. Framework',
  '12. Авторизация',
  '13. SQL и PostgreSQL',
  '13. PostgreSQL',
  '14. Docker',
  '15. Caddy и nginx',
  '16. CI/CD',
  '17. Frontend observability',
  '17. Backend observability',
  '18. Git и командная разработка',
  '19. Code review',
  '20. Работа с AI-агентами',
  '21. Технический английский',
  '22. Алгоритмы и структуры данных',
  'Не сейчас',
])

function topic(id: string): Topic {
  const found = roadmapIndex.topics.get(id)?.topic
  expect(found, `missing topic ${id}`).toBeDefined()
  return found!
}

function expectRefs(id: string, expected: string[]) {
  expect(topic(id).sourceRefs).toEqual(expected)
}

describe('Task 6 review corrections', () => {
  it('keeps each overloaded cluster split into a learnable topic', () => {
    ;[
      'architecture-module-contracts',
      'architecture-runtime-configuration',
      'architecture-packages-versioning',
      'react-virtualization',
      'react-lazy-suspense',
      'react-transitions-deferred',
      'nestjs-dependency-injection',
      'fastify-request-lifecycle',
      'fastify-operational-plugins',
      'postgres-concurrency-pool',
      'postgres-migrations-tooling',
    ].forEach((id) => expect(roadmapIndex.topics.has(id), id).toBe(true))

    ;[
      'react-delivery-performance',
      'fastify-service-resilience',
      'postgres-runtime-migrations',
    ].forEach((id) => expect(roadmapIndex.topics.has(id), id).toBe(false))
  })

  it('assigns architecture references to their semantic owners', () => {
    expectRefs('architecture-runtime-boundaries', [
      'L0872',
      'L0873',
      'L0874',
      'L0875',
      'L0876',
      'L0877',
      'L0878',
    ])
    expectRefs('architecture-module-contracts', ['L0879', 'L0880', 'L0881'])
    expectRefs('architecture-runtime-configuration', [
      'L0882',
      'L0883',
      'L0884',
    ])
    expectRefs('architecture-packages-versioning', [
      'L0885',
      'L0886',
      'L0887',
    ])
    expect(topic('architecture-adrs').sourceRefs).not.toEqual(
      expect.arrayContaining(['L0885', 'L0886', 'L0887']),
    )
  })

  it('assigns framework, Docker and deferred references to their owners', () => {
    expectRefs('nestjs-dependency-injection', ['L1335', 'L1341'])
    expect(topic('fastify-api-contracts').sourceRefs).not.toEqual(
      expect.arrayContaining(['L1335', 'L1341']),
    )
    expect(topic('backend-auth-sessions').sourceRefs).toContain('L1344')
    expect(topic('backend-authorization-ownership').sourceRefs).toContain(
      'L1345',
    )

    expect(topic('docker-image-build').sourceRefs).not.toEqual(
      expect.arrayContaining(['L1471', 'L1472', 'L1473']),
    )
    expect(topic('docker-compose-runtime').sourceRefs).toEqual(
      expect.arrayContaining([
        'L1471',
        'L1472',
        'L1473',
        'L1474',
        'L1475',
        'L1476',
        'L1477',
      ]),
    )
    expect(topic('docker-compose-runtime').sourceRefs).not.toEqual(
      expect.arrayContaining([
        'L1478',
        'L1479',
        'L1480',
        'L1481',
        'L1482',
        'L1483',
      ]),
    )
    expect(topic('docker-secure-delivery').sourceRefs).toEqual(
      expect.arrayContaining([
        'L1478',
        'L1479',
        'L1480',
        'L1481',
        'L1482',
        'L1483',
      ]),
    )
    expect(topic('deferred-kubernetes-devops').sourceRefs).toContain('L0053')
    expect(topic('deferred-microservices-messaging').sourceRefs).toContain(
      'L0054',
    )
  })

  it('pins exact sources for the source-support gaps', () => {
    const expectedSources: Record<string, string[]> = {
      'architecture-principles': ['fowler-modularizing-react'],
      'architecture-layers': ['fowler-modularizing-react'],
      'architecture-runtime-boundaries': ['fowler-modularizing-react'],
      'architecture-adrs': ['adr-madr'],
      'bundle-analysis': ['vite-bundle-visualizer'],
      'react-virtualization': ['tanstack-virtual'],
      'react-lazy-suspense': ['react-lazy', 'react-suspense'],
      'react-transitions-deferred': [
        'react-use-transition',
        'react-use-deferred-value',
      ],
      'node-io-errors': ['node-fs', 'node-streams', 'node-errors'],
      'fastify-api-contracts': ['fastify-swagger'],
      'fastify-operational-plugins': [
        'fastify-rate-limit',
        'fastify-multipart',
        'fastify-under-pressure',
      ],
      'backend-background-jobs': ['bullmq-guide'],
      'postgres-concurrency-pool': [
        'postgres-transaction-iso',
        'postgres-locking',
        'node-postgres-pool',
      ],
      'postgres-migrations-tooling': [
        'drizzle-migrations',
        'prisma-query-optimization',
      ],
      'health-metrics-uptime': [
        'kubernetes-probes',
        'opentelemetry-metrics',
        'uptime-kuma',
      ],
      'agent-verification-safety': [
        'google-code-review',
        'fowler-test-driven-development',
      ],
      'agent-deliberate-practice': [
        'fowler-test-driven-development',
        'google-code-review',
      ],
      'english-experience-stories': ['star-method', 'europass-cv'],
    }

    Object.entries(expectedSources).forEach(([topicId, sourceIds]) => {
      const assigned = Object.values(topic(topicId).sourceIds)
      sourceIds.forEach((sourceId) => {
        expect(assigned, `${topicId} needs ${sourceId}`).toContain(sourceId)
      })
    })
  })

  it('uses real page reading targets instead of roadmap labels', () => {
    migratedSourceIds.forEach((id) => {
      const source = roadmapIndex.sources.get(id)
      expect(source, `missing source ${id}`).toBeDefined()
      expect(source?.section, `${id} needs an exact reading target`).toBeTruthy()
      expect(
        originalMapSectionLabels.has(source?.section ?? ''),
        `${id} still points to an original roadmap label`,
      ).toBe(false)
    })
  })

  it('keeps deferred hierarchy refs unique while assigning its catalog topics', () => {
    expect(roadmap.metaSourceRefs).not.toContain('L0019')
    expect(roadmap.deferred.sourceRefs).toEqual(['L0019'])
    expect(roadmap.deferred.modules[0].sourceRefs).toEqual(['L0049'])
  })
})
