import type {
  ProgressState,
  TopicStatus,
} from '../../domain/progress/types'
import type {
  RoadmapIndex,
  Topic,
} from '../../domain/roadmap/types'
import { Button } from '../../ui/Button'
import { StatusPill } from '../../ui/StatusPill'

const STATUS_COPY: Record<TopicStatus, string> = {
  not_started: 'Новая',
  active: 'Текущий фокус',
  paused: 'Приостановлена',
  awaiting_review: 'Первое повторение',
  mastered: 'Освоена',
}

const STATUS_TONE = {
  not_started: 'neutral',
  active: 'active',
  paused: 'paused',
  awaiting_review: 'review',
  mastered: 'mastered',
} as const

interface RoadmapTopicRowProps {
  index: RoadmapIndex
  onFocus: (topicId: string) => void
  onQueueAdd: (topicId: string) => void
  onQueueRemove: (topicId: string) => void
  progress: ProgressState
  topic: Topic
}

export function RoadmapTopicRow({
  index,
  onFocus,
  onQueueAdd,
  onQueueRemove,
  progress,
  topic,
}: RoadmapTopicRowProps) {
  const status = progress.topics[topic.id]?.status ?? 'not_started'
  const queued = progress.queue.includes(topic.id)
  const missingDependencies = topic.dependencies
    .filter(
      (dependencyId) =>
        progress.topics[dependencyId]?.status !== 'mastered',
    )
    .map((dependencyId) => index.topics.get(dependencyId)?.topic.title)
    .filter((title): title is string => title !== undefined)
  const canFocus = status === 'not_started' || status === 'paused'
  const canQueue = canFocus

  return (
    <li className="roadmap-topic">
      <div className="roadmap-topic__main">
        <a
          className="roadmap-topic__title"
          href={`#/topic/${topic.id}`}
        >
          {topic.title}
        </a>
        <div className="roadmap-topic__meta">
          <StatusPill tone={STATUS_TONE[status]}>
            {STATUS_COPY[status]}
          </StatusPill>
          <span>
            {topic.estimatedMinutes[0]}–{topic.estimatedMinutes[1]} мин
          </span>
        </div>
        {missingDependencies.length ? (
          <p className="roadmap-topic__dependencies">
            <strong>Полезная база:</strong>{' '}
            {missingDependencies.join(', ')}. Выбор доступен.
          </p>
        ) : null}
      </div>

      <div className="roadmap-topic__actions">
        {canFocus ? (
          <Button
            aria-label={`Сделать фокусом: ${topic.title}`}
            onClick={() => onFocus(topic.id)}
            variant="quiet"
          >
            Сделать фокусом
          </Button>
        ) : null}
        {queued ? (
          <Button
            aria-label={`Убрать из очереди: ${topic.title}`}
            onClick={() => onQueueRemove(topic.id)}
            variant="secondary"
          >
            Убрать из очереди
          </Button>
        ) : canQueue ? (
          <Button
            aria-label={`Добавить в очередь: ${topic.title}`}
            onClick={() => onQueueAdd(topic.id)}
            variant="secondary"
          >
            В очередь
          </Button>
        ) : null}
      </div>
    </li>
  )
}
