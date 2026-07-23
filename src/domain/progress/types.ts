export type StudyStepId =
  | 'source'
  | 'obsidian'
  | 'anki'
  | 'practice'
  | 'selfCheck'
  | 'firstReview'

export type TopicStatus =
  | 'not_started'
  | 'active'
  | 'paused'
  | 'awaiting_review'
  | 'mastered'

export interface TopicProgress {
  status: TopicStatus
  completedSteps: Partial<Record<StudyStepId, string>>
  obsidianUrl?: string
  reviewDueAt?: string
  startedAt?: string
  masteredAt?: string
}

export interface ProgressState {
  schemaVersion: 1
  activeTopicId: string | null
  queue: string[]
  topics: Record<string, TopicProgress>
  history: Array<{
    topicId: string
    type: 'started' | 'paused' | 'step-completed' | 'mastered'
    at: string
  }>
}

export interface LoadProgressResult {
  state: ProgressState
  warning?: 'unavailable' | 'invalid'
}

export type SaveProgressResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'quota' }

export type ProgressAction =
  | { type: 'topic/activate'; topicId: string; at: string }
  | {
      type: 'topic/complete-step'
      topicId: string
      step: StudyStepId
      at: string
    }
  | { type: 'topic/set-obsidian-url'; topicId: string; url: string }
  | { type: 'queue/add'; topicId: string }
  | { type: 'queue/remove'; topicId: string }
  | { type: 'state/replace'; state: ProgressState }
  | { type: 'state/reset' }
