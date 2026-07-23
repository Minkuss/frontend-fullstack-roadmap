import { describe, expect, it } from 'vitest'

import routeOneJson from '../../content/roadmap/route-frontend-model.json'
import routeTwoJson from '../../content/roadmap/route-data-flow.json'
import type { RoadmapLane, Topic } from '../domain/roadmap/types'

const routeOne = routeOneJson as RoadmapLane
const routeTwo = routeTwoJson as RoadmapLane
const topics = [...routeOne.modules, ...routeTwo.modules].flatMap(
  (module) => module.topics,
)
const topicById = new Map(topics.map((topic) => [topic.id, topic]))

interface TopicContract {
  dependencies: string[]
  sourceIds: Topic['sourceIds']
  sourceRefs: string[]
}

const contracts: Record<string, TopicContract> = {
  'async-retry-backoff': {
    dependencies: ['promise-basics', 'event-loop'],
    sourceIds: { primary: 'aws-retry-backoff' },
    sourceRefs: ['L0241', 'L0242', 'L0260'],
  },
  'async-concurrency-limit': {
    dependencies: ['promise-basics', 'event-loop'],
    sourceIds: { primary: 'p-limit-readme' },
    sourceRefs: ['L0243', 'L0262'],
  },
  'react-request-retry': {
    dependencies: ['async-retry-backoff', 'react-async-ui-states'],
    sourceIds: { primary: 'tanstack-query-retries' },
    sourceRefs: ['L0748', 'L0761'],
  },
  'react-optimistic-ui': {
    dependencies: ['react-async-ui-states', 'values-references'],
    sourceIds: { primary: 'tanstack-query-optimistic-updates' },
    sourceRefs: ['L0755'],
  },
  'http-cache-validation': {
    dependencies: ['http-request-lifecycle'],
    sourceIds: {
      primary: 'mdn-ru-http-caching',
      practice: 'mdn-ru-cache-control',
    },
    sourceRefs: ['L0940', 'L0941', 'L0942', 'L0943', 'L0964'],
  },
  'http-cors-credentials': {
    dependencies: ['http-request-lifecycle'],
    sourceIds: { primary: 'doka-cors' },
    sourceRefs: ['L0939', 'L0944', 'L0945', 'L0946'],
  },
  'browser-service-worker-cache': {
    dependencies: ['browser-navigation-storage', 'promise-basics'],
    sourceIds: { primary: 'mdn-service-worker-api' },
    sourceRefs: ['L1000'],
  },
  'browser-web-worker': {
    dependencies: ['browser-rendering-pipeline'],
    sourceIds: { primary: 'mdn-web-workers-api' },
    sourceRefs: ['L1001'],
  },
  'browser-http-cache': {
    dependencies: ['http-cache-validation'],
    sourceIds: { primary: 'mdn-ru-browser-http-cache' },
    sourceRefs: ['L1002'],
  },
  'query-infinite-lists': {
    dependencies: ['query-flows-prefetch'],
    sourceIds: { primary: 'tanstack-query-v5-infinite-queries' },
    sourceRefs: ['L0827'],
  },
  'query-ssr-hydration': {
    dependencies: ['tanstack-query-basics'],
    sourceIds: { primary: 'tanstack-query-v5-ssr' },
    sourceRefs: ['L0833'],
  },
  'query-offline-mode': {
    dependencies: ['tanstack-query-basics'],
    sourceIds: { primary: 'tanstack-query-v5-offline-example' },
    sourceRefs: ['L0835'],
  },
  'csp-framing-defense': {
    dependencies: ['frontend-threat-model-xss'],
    sourceIds: { primary: 'mdn-ru-csp' },
    sourceRefs: ['L1064', 'L1065', 'L1066', 'L1080', 'L1088'],
  },
  'open-redirect-defense': {
    dependencies: ['frontend-threat-model-xss'],
    sourceIds: { primary: 'owasp-unvalidated-redirects' },
    sourceRefs: ['L1067', 'L1087'],
  },
  'dependency-supply-chain': {
    dependencies: ['frontend-threat-model-xss'],
    sourceIds: {
      primary: 'owasp-vulnerable-dependencies',
      practice: 'github-dependency-review',
    },
    sourceRefs: ['L1068', 'L1069', 'L1083'],
  },
  'oauth-pkce': {
    dependencies: ['frontend-auth-model'],
    sourceIds: { primary: 'ietf-oauth-security-bcp' },
    sourceRefs: ['L1070', 'L1072', 'L1089'],
  },
  'oidc-authentication': {
    dependencies: ['oauth-pkce'],
    sourceIds: { primary: 'openid-connect-core' },
    sourceRefs: ['L1071'],
  },
  'bff-session': {
    dependencies: ['oauth-pkce', 'csrf-cookie-defense'],
    sourceIds: { primary: 'ietf-browser-based-apps-bff' },
    sourceRefs: ['L1073'],
  },
  'telegram-init-data': {
    dependencies: ['frontend-auth-model'],
    sourceIds: { primary: 'telegram-mini-apps-init-data' },
    sourceRefs: ['L1074', 'L1081'],
  },
}

describe('coherent roadmap learning cycles', () => {
  it('splits broad clusters into one-source outcomes with exact traceability', () => {
    expect(
      routeOne.modules.flatMap((module) => module.topics),
    ).toHaveLength(31)
    expect(
      routeTwo.modules.flatMap((module) => module.topics),
    ).toHaveLength(34)

    Object.entries(contracts).forEach(([topicId, contract]) => {
      const topic = topicById.get(topicId)

      expect(topic, topicId).toBeDefined()
      expect(topic?.dependencies, topicId).toEqual(contract.dependencies)
      expect(topic?.sourceIds, topicId).toEqual(contract.sourceIds)
      expect(topic?.sourceRefs, topicId).toEqual(contract.sourceRefs)
      expect(
        Object.keys(topic?.sourceIds ?? {}).length,
        `${topicId}: source roles`,
      ).toBeLessThanOrEqual(3)
    })
  })

  it('orders each new prerequisite before its dependent cycle', () => {
    const orderedIds = topics.map((topic) => topic.id)

    ;[
      ['async-retry-backoff', 'react-request-retry'],
      ['http-cache-validation', 'browser-http-cache'],
      ['tanstack-query-basics', 'query-ssr-hydration'],
      ['frontend-auth-model', 'csrf-cookie-defense'],
      ['oauth-pkce', 'oidc-authentication'],
      ['csrf-cookie-defense', 'bff-session'],
    ].forEach(([prerequisite, dependent]) => {
      expect(
        orderedIds.indexOf(prerequisite),
        `${prerequisite} before ${dependent}`,
      ).toBeLessThan(orderedIds.indexOf(dependent))
    })
  })
})
