import type {
  ProgressState,
  TopicStatus,
} from '../../domain/progress/types'
import type { RoadmapLane, Topic } from '../../domain/roadmap/types'

export type DurationFilter = 'all' | '10-30' | '31-60' | '61-plus'

export interface RoadmapFilters {
  status: TopicStatus | 'all'
  routeId: string | 'all'
  duration: DurationFilter
  query: string
  includeDeferred: boolean
}

function matchesDuration(topic: Topic, duration: DurationFilter) {
  if (duration === 'all') {
    return true
  }

  const upperEstimate = topic.estimatedMinutes[1]

  if (duration === '10-30') {
    return upperEstimate <= 30
  }
  if (duration === '31-60') {
    return upperEstimate >= 31 && upperEstimate <= 60
  }

  return upperEstimate >= 61
}

export function filterRoadmap(
  lanes: RoadmapLane[],
  progress: ProgressState,
  filters: RoadmapFilters,
): RoadmapLane[] {
  const query = filters.query.trim().toLocaleLowerCase('ru-RU')

  return lanes.flatMap((lane) => {
    if (
      (lane.kind === 'deferred' && !filters.includeDeferred) ||
      (filters.routeId !== 'all' && lane.id !== filters.routeId)
    ) {
      return []
    }

    const modules = lane.modules.flatMap((module) => {
      const moduleTitle = module.title.toLocaleLowerCase('ru-RU')
      const topics = module.topics.filter((topic) => {
        const status = progress.topics[topic.id]?.status ?? 'not_started'
        const searchableTitle =
          `${moduleTitle} ${topic.title.toLocaleLowerCase('ru-RU')}`

        return (
          (filters.status === 'all' || status === filters.status) &&
          matchesDuration(topic, filters.duration) &&
          (!query || searchableTitle.includes(query))
        )
      })

      return topics.length ? [{ ...module, topics }] : []
    })

    return modules.length ? [{ ...lane, modules }] : []
  })
}
