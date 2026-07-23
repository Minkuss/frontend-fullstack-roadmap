import { useProgress } from '../../app/ProgressProvider'
import { roadmap, roadmapIndex } from '../../content/loadRoadmap'
import type {
  ProgressState,
  TopicStatus,
} from '../../domain/progress/types'

const HISTORY_LABELS: Record<
  ProgressState['history'][number]['type'],
  string
> = {
  started: 'Начата тема',
  paused: 'Тема приостановлена',
  'step-completed': 'Завершён учебный шаг',
  mastered: 'Освоена тема',
}

interface TopicSectionProps {
  emptyCopy: string
  id: string
  status: TopicStatus
  title: string
}

function TopicSection({
  emptyCopy,
  id,
  status,
  title,
}: TopicSectionProps) {
  const { state } = useProgress()
  const topics = Object.entries(state.topics)
    .filter(([, progress]) => progress.status === status)
    .flatMap(([topicId]) => {
      const location = roadmapIndex.topics.get(topicId)
      return location ? [location] : []
    })

  return (
    <section aria-labelledby={id} className="progress-section">
      <h2 id={id}>{title}</h2>
      {topics.length ? (
        <ul className="progress-topic-list">
          {topics.map(({ module, route, topic }) => (
            <li key={topic.id}>
              <a href={`#/topic/${topic.id}`}>{topic.title}</a>
              <span>
                {route.title} · {module.title}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-copy">{emptyCopy}</p>
      )}
    </section>
  )
}

function ModuleSummaries() {
  const { state } = useProgress()
  const lanes = [
    ...roadmap.routes,
    roadmap.petProject,
    roadmap.background,
    roadmap.deferred,
  ]
  const summaries = lanes.flatMap((route) =>
    route.modules.flatMap((module) => {
      const mastered = module.topics.filter(
        ({ id }) => state.topics[id]?.status === 'mastered',
      ).length
      const inProgress = module.topics.filter(({ id }) =>
        ['active', 'paused', 'awaiting_review'].includes(
          state.topics[id]?.status ?? 'not_started',
        ),
      ).length

      if (mastered === 0 && inProgress === 0) {
        return []
      }

      return [
        {
          id: module.id,
          moduleTitle: module.title,
          routeTitle: route.title,
          summary: `${mastered} освоено · ${inProgress} в работе · ${module.topics.length - mastered - inProgress} впереди`,
        },
      ]
    }),
  )

  return (
    <section
      aria-labelledby="module-progress-title"
      className="progress-modules"
    >
      <h2 id="module-progress-title">Модули</h2>
      {summaries.length ? (
        <ul>
          {summaries.map((summary) => (
            <li
              aria-label={`${summary.moduleTitle}: ${summary.summary}`}
              key={summary.id}
            >
              <span>{summary.routeTitle}</span>
              <strong>{summary.moduleTitle}</strong>
              <small>{summary.summary}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-copy">
          Сводка модулей появится после начала первой темы.
        </p>
      )}
    </section>
  )
}

function History() {
  const { state } = useProgress()

  return (
    <section aria-labelledby="progress-history-title" className="progress-history">
      <h2 id="progress-history-title">История</h2>
      {state.history.length ? (
        <ol>
          {[...state.history].reverse().map((entry, index) => {
            const title =
              roadmapIndex.topics.get(entry.topicId)?.topic.title ??
              entry.topicId
            return (
              <li key={`${entry.at}-${entry.topicId}-${entry.type}-${index}`}>
                <span>
                  {HISTORY_LABELS[entry.type]}: {title}
                </span>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="muted-copy">
          История начнётся с первого учебного шага.
        </p>
      )}
    </section>
  )
}

export function ProgressPage() {
  return (
    <section className="study-page progress-page">
      <header className="study-page__intro">
        <p className="study-page__eyebrow">Сделанные шаги</p>
        <h1>Прогресс</h1>
        <p className="study-page__lead">
          Здесь видны текущие циклы, спокойные паузы и уже освоенные темы.
          Пропущенные дни ничего не отнимают.
        </p>
      </header>

      <div className="progress-page__sections">
        <TopicSection
          emptyCopy="Сейчас нет активной темы."
          id="active-progress-title"
          status="active"
          title="Текущая тема"
        />
        <TopicSection
          emptyCopy="Приостановленных тем пока нет."
          id="paused-progress-title"
          status="paused"
          title="Приостановлено"
        />
        <TopicSection
          emptyCopy="Тем для первого повторения пока нет."
          id="review-progress-title"
          status="awaiting_review"
          title="Ожидают первого повторения"
        />
        <TopicSection
          emptyCopy="Освоенные темы появятся здесь."
          id="mastered-progress-title"
          status="mastered"
          title="Освоено"
        />
      </div>

      <ModuleSummaries />
      <History />
    </section>
  )
}
