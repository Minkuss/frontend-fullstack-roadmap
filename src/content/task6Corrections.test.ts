import { describe, expect, it } from 'vitest'

import type { Topic } from '../domain/roadmap/types'
import { roadmap, roadmapIndex } from './loadRoadmap'

const task6Lanes = [
  roadmap.routes[2],
  roadmap.routes[3],
  roadmap.petProject,
  roadmap.background,
  roadmap.deferred,
]

const task6SourceIds = new Set(
  task6Lanes.flatMap((lane) =>
    lane.modules.flatMap((module) =>
      module.topics.flatMap((item) => Object.values(item.sourceIds)),
    ),
  ),
)

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
    expectRefs('node-io-errors', ['L1324', 'L1325', 'L1326', 'L1327'])
    expectRefs('node-package-management', ['L1328'])
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
      'node-package-management': ['npm-package-lock', 'npm-ci'],
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
      'agent-task-contract': [
        'openai-model-guidance',
        'agile-alliance-user-stories',
        'github-tasklists',
      ],
      'agent-repository-instructions': ['openai-agents-md'],
      'agent-review-loop': [
        'fowler-test-driven-development',
        'google-code-review',
      ],
      'agent-prompt-injection': ['owasp-llm-prompt-injection'],
      'agent-change-controls': [
        'github-dependency-review',
        'atlas-migration-safety',
        'owasp-agent-command-execution',
      ],
      'agent-decision-review': ['adr-madr', 'google-code-review'],
      'english-experience-stories': ['star-method', 'europass-cv'],
    }

    Object.entries(expectedSources).forEach(([topicId, sourceIds]) => {
      const assigned = Object.values(topic(topicId).sourceIds)
      sourceIds.forEach((sourceId) => {
        expect(assigned, `${topicId} needs ${sourceId}`).toContain(sourceId)
      })
    })
  })

  it('uses real page reading targets for every Task 6 source', () => {
    task6SourceIds.forEach((id) => {
      const source = roadmapIndex.sources.get(id)
      expect(source, `missing source ${id}`).toBeDefined()
      expect(source?.section, `${id} needs an exact reading target`).toBeTruthy()
      expect(
        source?.section,
        `${id} still points to a roadmap-number section`,
      ).not.toMatch(/^\d+(?:\.\d+)*\.$/)
    })
  })

  it('splits AI work into exact task, review, security and decision owners', () => {
    expectRefs('agent-task-contract', [
      'L1714',
      'L1716',
      'L1717',
      'L1718',
      'L1719',
    ])
    expectRefs('agent-repository-instructions', ['L1720', 'L1721'])
    expectRefs('agent-review-loop', ['L1722', 'L1723', 'L1724', 'L1725'])
    expectRefs('agent-prompt-injection', ['L1726', 'L1727'])
    expectRefs('agent-change-controls', ['L1728', 'L1729', 'L1730'])
    expectRefs('agent-decision-review', ['L1731', 'L1732', 'L1733'])

    ;[
      'agent-task-contract',
      'agent-repository-instructions',
      'agent-review-loop',
      'agent-prompt-injection',
      'agent-change-controls',
      'agent-decision-review',
    ].forEach((id) => {
      expect(
        Object.values(topic(id).sourceIds).length,
        `${id} exceeds three source roles`,
      ).toBeLessThanOrEqual(3)
    })
  })

  it('keeps deferred hierarchy refs unique while assigning its catalog topics', () => {
    expect(roadmap.metaSourceRefs).not.toContain('L0019')
    expect(roadmap.deferred.sourceRefs).toEqual(['L0019'])
    expect(roadmap.deferred.modules[0].sourceRefs).toEqual(['L0049'])
  })
})
