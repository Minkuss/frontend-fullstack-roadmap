import type { RoadmapIndex } from '../roadmap/types'
import { isProgressState } from './storage'
import type { ProgressState } from './types'

export interface ProgressExport {
  format: 'frontend-path-progress'
  exportedAt: string
  progress: ProgressState
}

export type ImportResult =
  | {
      ok: true
      state: ProgressState
      unknownTopicIds: string[]
    }
  | {
      ok: false
      reason: 'invalid-json' | 'invalid-format' | 'invalid-progress'
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const milliseconds = Date.parse(value)
  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  )
}

export function exportProgress(state: ProgressState, now: string): string {
  if (!isIsoTimestamp(now)) {
    throw new Error(`Invalid ISO timestamp: ${now}`)
  }

  const backup: ProgressExport = {
    format: 'frontend-path-progress',
    exportedAt: now,
    progress: state,
  }

  return JSON.stringify(backup, null, 2)
}

function collectUnknownTopicIds(
  state: ProgressState,
  index: RoadmapIndex,
): string[] {
  const referencedTopicIds = [
    state.activeTopicId,
    ...state.queue,
    ...Object.keys(state.topics),
    ...state.history.map(({ topicId }) => topicId),
  ]

  return [
    ...new Set(
      referencedTopicIds.filter(
        (topicId): topicId is string =>
          topicId !== null && !index.topics.has(topicId),
      ),
    ),
  ].sort()
}

export function parseProgressImport(
  raw: string,
  index: RoadmapIndex,
): ImportResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, reason: 'invalid-json' }
  }

  if (
    !isRecord(parsed) ||
    parsed.format !== 'frontend-path-progress' ||
    !isIsoTimestamp(parsed.exportedAt)
  ) {
    return { ok: false, reason: 'invalid-format' }
  }

  if (!isProgressState(parsed.progress)) {
    return { ok: false, reason: 'invalid-progress' }
  }

  return {
    ok: true,
    state: parsed.progress,
    unknownTopicIds: collectUnknownTopicIds(parsed.progress, index),
  }
}
