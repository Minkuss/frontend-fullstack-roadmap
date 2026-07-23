import type {
  Roadmap,
  RoadmapIndex,
  Topic,
  TopicLocation,
} from '../roadmap/types'
import type { ProgressState } from '../progress/types'

export interface FocusSelection {
  topicId: string | null
  reason:
    | 'active'
    | 'queue'
    | 'recommended'
    | 'missing-prerequisites'
    | 'complete'
  nextTopicIds: string[]
  dueReviewTopicIds: string[]
  missingDependencies: string[]
}

interface OrderedTopic {
  topic: Topic
  location: TopicLocation
  order: number
}

function parseIsoTimestamp(value: string): number {
  const milliseconds = Date.parse(value)

  if (
    !Number.isFinite(milliseconds) ||
    new Date(milliseconds).toISOString() !== value
  ) {
    throw new Error(`Invalid ISO timestamp: ${value}`)
  }

  return milliseconds
}

function orderedTopics(
  roadmap: Roadmap,
  index: RoadmapIndex,
): OrderedTopic[] {
  const lanes = [
    ...roadmap.routes,
    roadmap.petProject,
    roadmap.background,
    roadmap.deferred,
  ].sort((left, right) => left.order - right.order)
  const result: OrderedTopic[] = []

  for (const lane of lanes) {
    for (const module of lane.modules) {
      for (const topic of module.topics) {
        const location = index.topics.get(topic.id)
        if (location) {
          result.push({ topic, location, order: result.length })
        }
      }
    }
  }

  return result
}

function missingDependencies(
  topic: Topic,
  progress: ProgressState,
): string[] {
  return topic.dependencies.filter(
    (dependencyId) =>
      progress.topics[dependencyId]?.status !== 'mastered',
  )
}

function canEnterAutomaticFocus(
  candidate: OrderedTopic,
  progress: ProgressState,
): boolean {
  const status = progress.topics[candidate.topic.id]?.status

  return (
    candidate.location.route.kind !== 'deferred' &&
    candidate.topic.recommendationWeight > 0 &&
    status !== 'mastered' &&
    status !== 'awaiting_review'
  )
}

function canUseManualQueue(
  candidate: OrderedTopic,
  progress: ProgressState,
): boolean {
  const status = progress.topics[candidate.topic.id]?.status

  return status !== 'mastered' && status !== 'awaiting_review'
}

function orderedCandidates(
  candidates: OrderedTopic[],
  progress: ProgressState,
): {
  available: OrderedTopic[]
  blocked: OrderedTopic[]
} {
  const available: OrderedTopic[] = []
  const blocked: OrderedTopic[] = []

  for (const candidate of candidates) {
    if (missingDependencies(candidate.topic, progress).length === 0) {
      available.push(candidate)
    } else {
      blocked.push(candidate)
    }
  }

  available.sort(
    (left, right) =>
      right.topic.recommendationWeight -
        left.topic.recommendationWeight || left.order - right.order,
  )

  return { available, blocked }
}

function dueReviewTopicIds(
  topics: OrderedTopic[],
  progress: ProgressState,
  nowMilliseconds: number,
): string[] {
  return topics
    .filter(({ topic }) => {
      const topicProgress = progress.topics[topic.id]
      return (
        topicProgress?.status === 'awaiting_review' &&
        topicProgress.reviewDueAt !== undefined &&
        Date.parse(topicProgress.reviewDueAt) <= nowMilliseconds
      )
    })
    .sort((left, right) => {
      const leftDueAt =
        progress.topics[left.topic.id]?.reviewDueAt ?? ''
      const rightDueAt =
        progress.topics[right.topic.id]?.reviewDueAt ?? ''
      return (
        Date.parse(leftDueAt) - Date.parse(rightDueAt) ||
        left.order - right.order
      )
    })
    .map(({ topic }) => topic.id)
}

export function selectFocus(
  roadmap: Roadmap,
  index: RoadmapIndex,
  progress: ProgressState,
  now: string,
): FocusSelection {
  const nowMilliseconds = parseIsoTimestamp(now)
  const topics = orderedTopics(roadmap, index)
  const byId = new Map(topics.map((candidate) => [candidate.topic.id, candidate]))
  const dueReviews = dueReviewTopicIds(topics, progress, nowMilliseconds)
  const automaticCandidates = topics.filter((candidate) =>
    canEnterAutomaticFocus(candidate, progress),
  )
  const { available, blocked } = orderedCandidates(
    automaticCandidates,
    progress,
  )

  let selectedId: string | null = null
  let reason: FocusSelection['reason'] = 'complete'

  if (
    progress.activeTopicId !== null &&
    byId.has(progress.activeTopicId)
  ) {
    selectedId = progress.activeTopicId
    reason = 'active'
  } else {
    const queued = progress.queue
      .map((topicId) => byId.get(topicId))
      .find(
        (candidate): candidate is OrderedTopic =>
          candidate !== undefined &&
          canUseManualQueue(candidate, progress),
      )

    if (queued) {
      selectedId = queued.topic.id
      reason = 'queue'
    } else if (available[0]) {
      selectedId = available[0].topic.id
      reason = 'recommended'
    } else if (blocked[0]) {
      selectedId = blocked[0].topic.id
      reason = 'missing-prerequisites'
    }
  }

  const remainingQueue = progress.queue
    .map((topicId) => byId.get(topicId))
    .filter(
      (candidate): candidate is OrderedTopic =>
        candidate !== undefined &&
        candidate.topic.id !== selectedId &&
        canEnterAutomaticFocus(candidate, progress),
    )
  const nextTopicIds = [
    ...remainingQueue,
    ...available,
    ...blocked,
  ]
    .filter(
      (candidate, indexInList, allCandidates) =>
        candidate.topic.id !== selectedId &&
        allCandidates.findIndex(
          (other) => other.topic.id === candidate.topic.id,
        ) === indexInList,
    )
    .slice(0, 3)
    .map(({ topic }) => topic.id)
  const selectedTopic =
    selectedId === null ? undefined : index.topics.get(selectedId)?.topic

  return {
    topicId: selectedId,
    reason,
    nextTopicIds,
    dueReviewTopicIds: dueReviews,
    missingDependencies: selectedTopic
      ? missingDependencies(selectedTopic, progress)
      : [],
  }
}
