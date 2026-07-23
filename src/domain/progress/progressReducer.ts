import type {
  ProgressAction,
  ProgressState,
  StudyStepId,
  TopicProgress,
} from './types'

const STUDY_STEP_ORDER: StudyStepId[] = [
  'source',
  'obsidian',
  'anki',
  'practice',
  'selfCheck',
  'firstReview',
]

export class ProgressDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProgressDomainError'
  }
}

export function createInitialProgress(): ProgressState {
  return {
    schemaVersion: 1,
    activeTopicId: null,
    queue: [],
    topics: {},
    history: [],
  }
}

function assertTimestamp(at: string) {
  if (!Number.isFinite(Date.parse(at))) {
    throw new ProgressDomainError(`Invalid timestamp: ${at}`)
  }
}

function addThreeDays(at: string) {
  const dueAt = new Date(at)
  dueAt.setDate(dueAt.getDate() + 3)
  return dueAt.toISOString()
}

function requireTopic(state: ProgressState, topicId: string) {
  const topic = state.topics[topicId]

  if (!topic) {
    throw new ProgressDomainError(`Topic is not started: ${topicId}`)
  }

  return topic
}

function activateTopic(
  state: ProgressState,
  topicId: string,
  at: string,
): ProgressState {
  assertTimestamp(at)

  const requestedTopic = state.topics[topicId]
  if (requestedTopic?.status === 'mastered') {
    throw new ProgressDomainError(`Topic is already mastered: ${topicId}`)
  }

  if (
    state.activeTopicId === topicId &&
    requestedTopic?.status === 'active'
  ) {
    return state
  }

  const topics = { ...state.topics }
  const history = [...state.history]

  if (state.activeTopicId && state.activeTopicId !== topicId) {
    const currentTopic = topics[state.activeTopicId]
    if (currentTopic?.status === 'active') {
      topics[state.activeTopicId] = {
        ...currentTopic,
        status: 'paused',
      }
      history.push({
        topicId: state.activeTopicId,
        type: 'paused',
        at,
      })
    }
  }

  topics[topicId] = requestedTopic
    ? {
        ...requestedTopic,
        status: 'active',
        startedAt: requestedTopic.startedAt ?? at,
      }
    : {
        status: 'active',
        completedSteps: {},
        startedAt: at,
      }
  history.push({ topicId, type: 'started', at })

  return {
    ...state,
    activeTopicId: topicId,
    queue: state.queue.filter((queuedId) => queuedId !== topicId),
    topics,
    history,
  }
}

function completeStep(
  state: ProgressState,
  topicId: string,
  step: StudyStepId,
  at: string,
): ProgressState {
  assertTimestamp(at)
  const topic = requireTopic(state, topicId)

  if (topic.status === 'mastered') {
    throw new ProgressDomainError(`Topic is already mastered: ${topicId}`)
  }
  if (topic.completedSteps[step]) {
    throw new ProgressDomainError(`Step already completed: ${step}`)
  }

  const expectedStep = STUDY_STEP_ORDER.find(
    (candidate) => !topic.completedSteps[candidate],
  )
  if (step !== expectedStep) {
    throw new ProgressDomainError(
      `Invalid step order: expected ${expectedStep ?? 'none'}, received ${step}`,
    )
  }

  const canCompleteReview =
    step === 'firstReview' &&
    (topic.status === 'awaiting_review' ||
      (topic.status === 'active' && state.activeTopicId === topicId))
  const canCompleteStudyStep =
    step !== 'firstReview' &&
    topic.status === 'active' &&
    state.activeTopicId === topicId

  if (!canCompleteReview && !canCompleteStudyStep) {
    throw new ProgressDomainError(`Topic is not active: ${topicId}`)
  }

  const completedTopic: TopicProgress = {
    ...topic,
    completedSteps: {
      ...topic.completedSteps,
      [step]: at,
    },
  }
  let activeTopicId = state.activeTopicId
  let queue = state.queue
  const history = [
    ...state.history,
    { topicId, type: 'step-completed' as const, at },
  ]

  if (step === 'selfCheck') {
    completedTopic.status = 'awaiting_review'
    completedTopic.reviewDueAt = addThreeDays(at)
    if (activeTopicId === topicId) {
      activeTopicId = null
    }
  }

  if (step === 'firstReview') {
    completedTopic.status = 'mastered'
    completedTopic.masteredAt = at
    if (activeTopicId === topicId) {
      activeTopicId = null
    }
    queue = queue.filter((queuedId) => queuedId !== topicId)
    history.push({ topicId, type: 'mastered', at })
  }

  return {
    ...state,
    activeTopicId,
    queue,
    topics: {
      ...state.topics,
      [topicId]: completedTopic,
    },
    history,
  }
}

export function progressReducer(
  state: ProgressState,
  action: ProgressAction,
): ProgressState {
  switch (action.type) {
    case 'topic/activate':
      return activateTopic(state, action.topicId, action.at)
    case 'topic/complete-step':
      return completeStep(state, action.topicId, action.step, action.at)
    case 'topic/set-obsidian-url': {
      const topic = requireTopic(state, action.topicId)
      return {
        ...state,
        topics: {
          ...state.topics,
          [action.topicId]: {
            ...topic,
            obsidianUrl: action.url,
          },
        },
      }
    }
    case 'queue/add': {
      const topic = state.topics[action.topicId]
      if (
        topic?.status === 'mastered' ||
        state.queue.includes(action.topicId)
      ) {
        return state
      }
      return { ...state, queue: [...state.queue, action.topicId] }
    }
    case 'queue/remove': {
      if (!state.queue.includes(action.topicId)) {
        return state
      }
      return {
        ...state,
        queue: state.queue.filter((topicId) => topicId !== action.topicId),
      }
    }
    case 'state/replace':
      return action.state
    case 'state/reset':
      return createInitialProgress()
  }
}
