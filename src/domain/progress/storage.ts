import { createInitialProgress } from './progressReducer'
import type {
  LoadProgressResult,
  ProgressState,
  SaveProgressResult,
  StudyStepId,
  TopicProgress,
  TopicStatus,
} from './types'

export const PROGRESS_STORAGE_KEY = 'frontend-path/progress'

const STUDY_STEP_ORDER: StudyStepId[] = [
  'source',
  'obsidian',
  'anki',
  'practice',
  'selfCheck',
  'firstReview',
]
const TOPIC_STATUSES: TopicStatus[] = [
  'not_started',
  'active',
  'paused',
  'awaiting_review',
  'mastered',
]
const HISTORY_TYPES = [
  'started',
  'paused',
  'step-completed',
  'mastered',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string'
}

function isOptionalTimestamp(value: unknown) {
  return value === undefined || isTimestamp(value)
}

function isTopicProgress(value: unknown): value is TopicProgress {
  if (
    !isRecord(value) ||
    !TOPIC_STATUSES.includes(value.status as TopicStatus) ||
    !isRecord(value.completedSteps) ||
    !isOptionalString(value.obsidianUrl) ||
    !isOptionalTimestamp(value.reviewDueAt) ||
    !isOptionalTimestamp(value.startedAt) ||
    !isOptionalTimestamp(value.masteredAt)
  ) {
    return false
  }

  const completedStepIds = Object.keys(value.completedSteps)
  if (
    completedStepIds.some(
      (step) => !STUDY_STEP_ORDER.includes(step as StudyStepId),
    ) ||
    Object.values(value.completedSteps).some((at) => !isTimestamp(at))
  ) {
    return false
  }

  const completedCount = completedStepIds.length
  const hasOrderedPrefix = STUDY_STEP_ORDER.every(
    (step, index) =>
      (index < completedCount) ===
      Object.prototype.hasOwnProperty.call(value.completedSteps, step),
  )
  if (!hasOrderedPrefix) {
    return false
  }

  if (value.status !== 'not_started' && !isTimestamp(value.startedAt)) {
    return false
  }
  if (
    value.status === 'awaiting_review' &&
    (completedCount !== 5 || !isTimestamp(value.reviewDueAt))
  ) {
    return false
  }
  if (
    value.status === 'mastered' &&
    (completedCount !== 6 ||
      !isTimestamp(value.reviewDueAt) ||
      !isTimestamp(value.masteredAt))
  ) {
    return false
  }

  return true
}

export function isProgressState(value: unknown): value is ProgressState {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    (value.activeTopicId !== null &&
      typeof value.activeTopicId !== 'string') ||
    !Array.isArray(value.queue) ||
    value.queue.some((topicId) => typeof topicId !== 'string') ||
    new Set(value.queue).size !== value.queue.length ||
    !isRecord(value.topics) ||
    !Object.values(value.topics).every(isTopicProgress) ||
    !Array.isArray(value.history)
  ) {
    return false
  }

  const topics = value.topics as Record<string, TopicProgress>
  const activeTopicIds = Object.entries(topics)
    .filter(([, topic]) => topic.status === 'active')
    .map(([topicId]) => topicId)

  if (
    (value.activeTopicId === null && activeTopicIds.length !== 0) ||
    (value.activeTopicId !== null &&
      (activeTopicIds.length !== 1 ||
        activeTopicIds[0] !== value.activeTopicId)) ||
    value.queue.some((topicId) => topics[topicId]?.status === 'mastered')
  ) {
    return false
  }

  return value.history.every(
    (entry) =>
      isRecord(entry) &&
      typeof entry.topicId === 'string' &&
      HISTORY_TYPES.includes(
        entry.type as (typeof HISTORY_TYPES)[number],
      ) &&
      isTimestamp(entry.at),
  )
}

export function loadProgress(
  storage: Pick<Storage, 'getItem'>,
): LoadProgressResult {
  let raw: string | null

  try {
    raw = storage.getItem(PROGRESS_STORAGE_KEY)
  } catch {
    return {
      state: createInitialProgress(),
      warning: 'unavailable',
    }
  }

  if (raw === null) {
    return {
      state: createInitialProgress(),
      warning: 'invalid',
    }
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (isProgressState(parsed)) {
      return { state: parsed }
    }
  } catch {
    // Invalid JSON uses the same recoverable result as invalid structure.
  }

  return {
    state: createInitialProgress(),
    warning: 'invalid',
  }
}

function isQuotaError(error: unknown) {
  if (!isRecord(error)) {
    return false
  }

  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  )
}

export function saveProgress(
  storage: Pick<Storage, 'setItem'>,
  state: ProgressState,
): SaveProgressResult {
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state))
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: isQuotaError(error) ? 'quota' : 'unavailable',
    }
  }
}
