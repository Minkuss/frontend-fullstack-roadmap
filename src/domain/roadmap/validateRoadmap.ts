import type {
  LearningSource,
  PracticeTask,
  Roadmap,
  RoadmapLane,
  RoadmapModule,
  Topic,
} from './types'

const laneKinds = ['primary-route', 'pet-project', 'background', 'deferred']
const sourceFormats = ['documentation', 'guide', 'article', 'course', 'video', 'exercise']
const topicPriorities = ['critical', 'high', 'supporting', 'background', 'deferred']

type RecordValue = Record<string, unknown>

function assertRecord(value: unknown, path: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path} must be an object`)
  }
}

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${path} must be a non-empty string`)
  }
}

function assertStringArray(value: unknown, path: string): asserts value is string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array of strings`)
  }

  value.forEach((item, index) => assertString(item, `${path}[${index}]`))
}

function assertNonEmptyArray(value: unknown, path: string): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path} must contain at least one ${path.endsWith('sources') ? 'source' : 'item'}`)
  }
}

function assertTupleMinutes(value: unknown, path: string): asserts value is [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every((minutes) => Number.isInteger(minutes) && minutes > 0) ||
    value[0] > value[1]
  ) {
    throw new Error(`${path} must be an ascending pair of positive whole minutes`)
  }
}

function assertIsoDate(value: unknown, path: string): asserts value is string {
  assertString(value, path)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${path} must be an ISO date`)
  }
}

function assertId(value: unknown, path: string): asserts value is string {
  assertString(value, path)
}

function assertEnum(value: unknown, allowed: string[], path: string): void {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new Error(`${path} must be one of: ${allowed.join(', ')}`)
  }
}

function assertUniqueId(id: string, ids: Set<string>, label: string): void {
  if (ids.has(id)) {
    throw new Error(`Duplicate ${label} id: ${id}`)
  }
  ids.add(id)
}

function validateSource(value: unknown, path: string): LearningSource {
  assertRecord(value, path)
  assertId(value.id, `${path}.id`)
  assertString(value.title, `${path}.title`)
  assertString(value.url, `${path}.url`)
  if (!value.url.startsWith('https://')) {
    throw new Error(`${path}.url must be an HTTPS URL`)
  }
  assertEnum(value.language, ['ru', 'en'], `${path}.language`)
  assertEnum(value.format, sourceFormats, `${path}.format`)
  assertIsoDate(value.lastVerifiedAt, `${path}.lastVerifiedAt`)

  if (value.section !== undefined) assertString(value.section, `${path}.section`)
  if (value.englishReason !== undefined) assertString(value.englishReason, `${path}.englishReason`)

  return value as unknown as LearningSource
}

function validatePractice(value: unknown, path: string): PracticeTask {
  assertRecord(value, path)
  assertId(value.id, `${path}.id`)
  assertString(value.title, `${path}.title`)
  assertNonEmptyArray(value.instructions, `${path}.instructions`)
  assertStringArray(value.instructions, `${path}.instructions`)
  assertString(value.minimumCompletion, `${path}.minimumCompletion`)
  const estimatedMinutes = value.estimatedMinutes
  if (
    typeof estimatedMinutes !== 'number' ||
    !Number.isInteger(estimatedMinutes) ||
    estimatedMinutes <= 0
  ) {
    throw new Error(`${path}.estimatedMinutes must be a positive whole number`)
  }

  return value as unknown as PracticeTask
}

function validateTopic(
  value: unknown,
  path: string,
  sourceIds: Set<string>,
): Topic {
  assertRecord(value, path)
  assertId(value.id, `${path}.id`)
  assertString(value.title, `${path}.title`)
  assertString(value.outcome, `${path}.outcome`)
  assertString(value.whyNow, `${path}.whyNow`)
  assertEnum(value.priority, topicPriorities, `${path}.priority`)
  if (
    typeof value.recommendationWeight !== 'number' ||
    !Number.isFinite(value.recommendationWeight) ||
    value.recommendationWeight < 0 ||
    value.recommendationWeight > 100
  ) {
    throw new Error(`${path}.recommendationWeight must be between 0 and 100`)
  }
  assertTupleMinutes(value.estimatedMinutes, `${path}.estimatedMinutes`)
  assertStringArray(value.dependencies, `${path}.dependencies`)
  assertRecord(value.sourceIds, `${path}.sourceIds`)
  assertId(value.sourceIds.primary, `${path}.sourceIds.primary`)
  assertSourceExists(value.sourceIds.primary, `${path}.sourceIds.primary`, sourceIds)

  for (const role of ['fallback', 'practice'] as const) {
    const sourceId = value.sourceIds[role]
    if (sourceId !== undefined) {
      assertId(sourceId, `${path}.sourceIds.${role}`)
      assertSourceExists(sourceId, `${path}.sourceIds.${role}`, sourceIds)
    }
  }

  assertRequiredStringArray(value.obsidianPrompts, `${path}.obsidianPrompts`)
  assertRequiredStringArray(value.ankiPrompts, `${path}.ankiPrompts`)
  assertNonEmptyArray(value.practice, `${path}.practice`)
  const practiceIds = new Set<string>()
  value.practice.forEach((practice, index) => {
    const task = validatePractice(practice, `${path}.practice[${index}]`)
    assertUniqueId(task.id, practiceIds, 'practice task')
  })
  assertRequiredStringArray(value.masteryChecks, `${path}.masteryChecks`)
  assertRequiredStringArray(value.quickSteps, `${path}.quickSteps`)
  assertRequiredStringArray(value.sourceRefs, `${path}.sourceRefs`)

  return value as unknown as Topic
}

function assertRequiredStringArray(value: unknown, path: string): asserts value is string[] {
  assertNonEmptyArray(value, path)
  assertStringArray(value, path)
}

function assertSourceExists(sourceId: string, path: string, sourceIds: Set<string>): void {
  if (!sourceIds.has(sourceId)) {
    throw new Error(`${path} references unknown source: ${sourceId}`)
  }
}

function validateModule(
  value: unknown,
  path: string,
  sourceIds: Set<string>,
): RoadmapModule {
  assertRecord(value, path)
  assertId(value.id, `${path}.id`)
  assertString(value.title, `${path}.title`)
  assertString(value.outcome, `${path}.outcome`)
  assertNonEmptyArray(value.topics, `${path}.topics`)
  value.topics.forEach((topic, index) =>
    validateTopic(topic, `${path}.topics[${index}]`, sourceIds),
  )
  assertRequiredStringArray(value.sourceRefs, `${path}.sourceRefs`)

  return value as unknown as RoadmapModule
}

export function validateLane(value: unknown, sources: LearningSource[]): RoadmapLane {
  return validateLaneAtPath(value, 'RoadmapLane', sources)
}

export function validateRoadmap(value: unknown): Roadmap {
  assertRecord(value, 'Roadmap')
  assertNonEmptyArray(value.sources, 'Roadmap.sources')
  assertNonEmptyArray(value.routes, 'Roadmap.routes')
  const contentVersion = value.contentVersion
  if (
    typeof contentVersion !== 'number' ||
    !Number.isInteger(contentVersion) ||
    contentVersion < 1
  ) {
    throw new Error('Roadmap.contentVersion must be a positive whole number')
  }
  const sources = value.sources.map((source, index) =>
    validateSource(source, `Roadmap.sources[${index}]`),
  )
  const sourceIds = new Set<string>()
  sources.forEach((source) => assertUniqueId(source.id, sourceIds, 'source'))

  const routes = value.routes.map((route, index) =>
    validateLaneAtPath(route, `Roadmap.routes[${index}]`, sources),
  )
  const petProject = validateLaneAtPath(value.petProject, 'Roadmap.petProject', sources)
  const background = validateLaneAtPath(value.background, 'Roadmap.background', sources)
  const deferred = validateLaneAtPath(value.deferred, 'Roadmap.deferred', sources)

  validateUniqueRoadmapIds([...routes, petProject, background, deferred])
  validateDependencies([...routes, petProject, background, deferred])
  assertRequiredStringArray(value.metaSourceRefs, 'Roadmap.metaSourceRefs')

  return value as unknown as Roadmap
}

function validateLaneAtPath(
  value: unknown,
  path: string,
  sources: LearningSource[],
): RoadmapLane {
  assertRecord(value, path)
  assertId(value.id, `${path}.id`)
  assertEnum(value.kind, laneKinds, `${path}.kind`)
  const order = value.order
  if (typeof order !== 'number' || !Number.isInteger(order) || order < 0) {
    throw new Error(`${path}.order must be a non-negative whole number`)
  }
  assertString(value.title, `${path}.title`)
  assertString(value.outcome, `${path}.outcome`)
  assertNonEmptyArray(value.modules, `${path}.modules`)
  const sourceIds = new Set(sources.map((source) => source.id))
  value.modules.forEach((module, index) =>
    validateModule(module, `${path}.modules[${index}]`, sourceIds),
  )
  assertRequiredStringArray(value.sourceRefs, `${path}.sourceRefs`)

  const lane = value as unknown as RoadmapLane
  validateUniqueRoadmapIds([lane])
  return lane
}

function validateUniqueRoadmapIds(lanes: RoadmapLane[]): void {
  const laneIds = new Set<string>()
  const moduleIds = new Set<string>()
  const topicIds = new Set<string>()

  lanes.forEach((lane) => {
    assertUniqueId(lane.id, laneIds, 'lane')
    lane.modules.forEach((module) => {
      assertUniqueId(module.id, moduleIds, 'module')
      module.topics.forEach((topic) => assertUniqueId(topic.id, topicIds, 'topic'))
    })
  })
}

function validateDependencies(lanes: RoadmapLane[]): void {
  const topicIds = new Set(
    lanes.flatMap((lane) => lane.modules.flatMap((module) => module.topics.map((topic) => topic.id))),
  )

  lanes.forEach((lane) => {
    lane.modules.forEach((module) => {
      module.topics.forEach((topic) => {
        topic.dependencies.forEach((dependency) => {
          if (!topicIds.has(dependency)) {
            throw new Error(`Topic ${topic.id} depends on unknown topic: ${dependency}`)
          }
        })
      })
    })
  })
}
