import { useProgress } from '../../app/ProgressProvider'
import { roadmap, roadmapIndex } from '../../content/loadRoadmap'
import { selectFocus } from '../../domain/recommendation/selectFocus'
import type { StudyStepId } from '../../domain/progress/types'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'

interface FocusPageProps {
  now: string
}

const STEP_ORDER: StudyStepId[] = [
  'source',
  'obsidian',
  'anki',
  'practice',
  'selfCheck',
  'firstReview',
]

const STEP_LABELS: Record<StudyStepId, string> = {
  source: 'Источник',
  obsidian: 'Obsidian',
  anki: 'Anki',
  practice: 'Практика',
  selfCheck: 'Проверка понимания',
  firstReview: 'Первое повторение',
}

const STEP_ACTIONS: Record<StudyStepId, string> = {
  source: 'Изучи основной материал и отметь важные места.',
  obsidian: 'Объясни тему своими словами в заметке.',
  anki: 'Сделай карточки на воспроизведение и объяснение.',
  practice: 'Выполни минимальный объём практики.',
  selfCheck: 'Проверь каждый критерий без опоры на конспект.',
  firstReview: 'Вернись к модели и восстанови её по памяти.',
}

const REASON_COPY = {
  active: 'Продолжить начатое',
  queue: 'Первый пункт личной очереди',
  recommended: 'Следующая доступная тема',
  'missing-prerequisites': 'Можно выбрать вручную, даже если база не завершена',
  complete: 'Все доступные циклы завершены',
} as const

function currentStepId(
  completedSteps: Partial<Record<StudyStepId, string>> = {},
) {
  return STEP_ORDER.find((step) => !completedSteps[step])
}

export function FocusPage({ now }: FocusPageProps) {
  const { state, dispatch } = useProgress()
  const selection = selectFocus(roadmap, roadmapIndex, state, now)
  const location =
    selection.topicId === null
      ? undefined
      : roadmapIndex.topics.get(selection.topicId)

  if (!location) {
    return (
      <section className="study-page">
        <header className="study-page__intro">
          <p className="study-page__eyebrow">Сегодня</p>
          <h1>Фокус</h1>
          <p className="study-page__lead">
            Ничего не нужно догонять. Можно выбрать тему, когда появится
            подходящий момент.
          </p>
        </header>
        <EmptyState
          title="Текущей темы пока нет"
          action={<a href="#/roadmap">Открыть roadmap</a>}
        >
          Автоматически тема не запускается.
        </EmptyState>
      </section>
    )
  }

  const { topic, module, route } = location
  const topicProgress = state.topics[topic.id]
  const step = currentStepId(topicProgress?.completedSteps)
  const isActive =
    state.activeTopicId === topic.id && topicProgress?.status === 'active'
  const masteredInModule = module.topics.filter(
    (candidate) => state.topics[candidate.id]?.status === 'mastered',
  ).length

  return (
    <section className="study-page focus-page">
      <header className="study-page__intro">
        <p className="study-page__eyebrow">
          {route.title} · {module.title}
        </p>
        <h1>{isActive ? topic.title : 'Фокус ещё не выбран'}</h1>
        <p className="study-page__lead">
          {isActive ? topic.outcome : `Предлагаю: ${topic.title}`}
        </p>
      </header>

      <section className="focus-action" aria-labelledby="focus-action-title">
        <div className="focus-action__reason">
          <span>{REASON_COPY[selection.reason]}</span>
          <span>
            {topic.estimatedMinutes[0]}–{topic.estimatedMinutes[1]} мин
          </span>
        </div>
        <h2 id="focus-action-title">
          {step ? `Текущий шаг: ${STEP_LABELS[step]}` : 'Учебный цикл завершён'}
        </h2>
        {step ? <p>{STEP_ACTIONS[step]}</p> : null}

        <div className="focus-action__primary">
          {isActive ? (
            <a className="button button--primary" href={`#/topic/${topic.id}`}>
              Открыть текущий шаг
            </a>
          ) : (
            <Button
              onClick={() =>
                dispatch({
                  type: 'topic/activate',
                  topicId: topic.id,
                  at: now,
                })
              }
            >
              Сделать текущим фокусом
            </Button>
          )}
        </div>
      </section>

      {isActive && topic.quickSteps[0] ? (
        <aside
          aria-label="Короткий шаг из текущей темы"
          className="quick-step"
        >
          <p className="quick-step__label">Если есть только 10–15 минут</p>
          <p>{topic.quickSteps[0]}</p>
        </aside>
      ) : null}

      <div className="focus-page__columns">
        <section aria-labelledby="next-topics-title">
          <h2 id="next-topics-title">Следующие темы</h2>
          {selection.nextTopicIds.length ? (
            <ol className="topic-link-list">
              {selection.nextTopicIds.map((topicId) => {
                const nextTopic = roadmapIndex.topics.get(topicId)?.topic
                return nextTopic ? (
                  <li key={topicId}>
                    <a href={`#/topic/${topicId}`}>{nextTopic.title}</a>
                  </li>
                ) : null
              })}
            </ol>
          ) : (
            <p className="muted-copy">Сейчас других тем нет.</p>
          )}
        </section>

        <section aria-labelledby="due-review-title">
          <h2 id="due-review-title">Первое повторение</h2>
          {selection.dueReviewTopicIds.length ? (
            <ul className="topic-link-list">
              {selection.dueReviewTopicIds.map((topicId) => {
                const dueTopic = roadmapIndex.topics.get(topicId)?.topic
                return dueTopic ? (
                  <li key={topicId}>
                    <a href={`#/topic/${topicId}`}>{dueTopic.title}</a>
                    <span>Можно повторить сейчас</span>
                  </li>
                ) : null
              })}
            </ul>
          ) : (
            <p className="muted-copy">
              Готовых к первому повторению тем пока нет.
            </p>
          )}
        </section>
      </div>

      <section
        aria-labelledby="module-context-title"
        className="module-context"
      >
        <p className="study-page__eyebrow">Контекст маршрута</p>
        <h2 id="module-context-title">{module.title}</h2>
        <p>{module.outcome}</p>
        <p className="muted-copy">
          Полный цикл завершён у {masteredInModule} из {module.topics.length}{' '}
          тем модуля.
        </p>
      </section>
    </section>
  )
}
