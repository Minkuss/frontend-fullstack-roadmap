import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useProgress } from '../../app/ProgressProvider'
import { roadmapIndex } from '../../content/loadRoadmap'
import type {
  StudyStepId,
  TopicProgress,
} from '../../domain/progress/types'
import type { LearningSource } from '../../domain/roadmap/types'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import {
  ProgressSteps,
  type StudyStage,
} from '../../ui/ProgressSteps'
import { EmptyState } from '../../ui/EmptyState'

interface TopicPageProps {
  getNow: () => string
  topicId: string
}

interface TopicStage extends StudyStage {
  actionLabel: string
  lead: string
}

const STUDY_STAGES: readonly TopicStage[] = [
  {
    id: 'source',
    title: 'Источник',
    lead: 'Сначала собери точную опорную модель.',
    actionLabel: 'Источник изучен',
  },
  {
    id: 'obsidian',
    title: 'Obsidian',
    lead: 'Объясни идею своими словами, а не копируй источник.',
    actionLabel: 'Заметка готова',
  },
  {
    id: 'anki',
    title: 'Anki',
    lead: 'Создай 4–7 карточек на воспроизведение и объяснение.',
    actionLabel: 'Карточки созданы',
  },
  {
    id: 'practice',
    title: 'Практика',
    lead: 'Проверь модель на небольшом, но законченном задании.',
    actionLabel: 'Практика выполнена',
  },
  {
    id: 'selfCheck',
    title: 'Проверка понимания',
    lead: 'Пройди все критерии без подсказок из заметки.',
    actionLabel: 'Проверка пройдена',
  },
  {
    id: 'firstReview',
    title: 'Первое повторение',
    lead: 'Через три дня восстанови модель по памяти. Дальше ведёт Anki.',
    actionLabel: 'Первое повторение выполнено',
  },
] as const

const STATUS_COPY: Record<TopicProgress['status'], string> = {
  not_started: 'Тема ещё не начата',
  active: 'Текущий фокус',
  paused: 'Тема приостановлена',
  awaiting_review: 'Ожидает первого повторения',
  mastered: 'Тема освоена',
}

function firstIncompleteStep(progress?: TopicProgress) {
  return STUDY_STAGES.find(
    (stage) => !progress?.completedSteps[stage.id],
  )?.id
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}

function SourceLink({
  label,
  source,
}: {
  label: string
  source?: LearningSource
}) {
  if (!source) {
    return null
  }

  return (
    <li>
      <span>{label}</span>
      <a
        href={source.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {source.title}
      </a>
      {source.section ? <small>Раздел: {source.section}</small> : null}
    </li>
  )
}

function StagePanel({
  action,
  children,
  complete,
  current,
  stage,
}: {
  action?: ReactNode
  children: ReactNode
  complete: boolean
  current: boolean
  stage: TopicStage
}) {
  return (
    <section
      aria-labelledby={`stage-${stage.id}`}
      className={[
        'topic-stage',
        current ? 'topic-stage--current' : '',
        complete ? 'topic-stage--complete' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="topic-stage__header">
        <h2 id={`stage-${stage.id}`}>{stage.title}</h2>
        <span>{complete ? 'Готово' : current ? 'Сейчас' : 'Позже'}</span>
      </div>
      <p className="muted-copy">{stage.lead}</p>
      <div className="topic-stage__body">{children}</div>
      {action ? <div className="topic-stage__action">{action}</div> : null}
    </section>
  )
}

export function TopicPage({ getNow, topicId }: TopicPageProps) {
  const { state, dispatch } = useProgress()
  const now = getNow()
  const location = roadmapIndex.topics.get(topicId)
  const progress = state.topics[topicId]
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false)
  const [obsidianUrl, setObsidianUrl] = useState(progress?.obsidianUrl ?? '')
  const [practiceConfirmed, setPracticeConfirmed] = useState(false)
  const [masteryChecks, setMasteryChecks] = useState<boolean[]>([])
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    setObsidianUrl(progress?.obsidianUrl ?? '')
  }, [progress?.obsidianUrl])

  if (!location) {
    return (
      <section className="study-page">
        <header className="study-page__intro">
          <p className="study-page__eyebrow">Микротема</p>
          <h1>Тема не найдена</h1>
        </header>
        <EmptyState
          title="Такой темы нет в roadmap"
          action={<a href="#/roadmap">Вернуться к roadmap</a>}
        >
          Возможно, ссылка устарела или идентификатор темы изменился.
        </EmptyState>
      </section>
    )
  }

  const { topic, module, route } = location
  const currentStep = firstIncompleteStep(progress)
  const isActive =
    state.activeTopicId === topicId && progress?.status === 'active'
  const currentActive = state.activeTopicId
    ? roadmapIndex.topics.get(state.activeTopicId)
    : undefined
  const missingDependencies = topic.dependencies
    .filter(
      (dependencyId) =>
        state.topics[dependencyId]?.status !== 'mastered',
    )
    .map((dependencyId) => roadmapIndex.topics.get(dependencyId))
    .filter((dependency) => dependency !== undefined)
  const primarySource = roadmapIndex.sources.get(topic.sourceIds.primary)
  const fallbackSource = topic.sourceIds.fallback
    ? roadmapIndex.sources.get(topic.sourceIds.fallback)
    : undefined
  const practiceSource = topic.sourceIds.practice
    ? roadmapIndex.sources.get(topic.sourceIds.practice)
    : undefined
  const canReview =
    progress?.reviewDueAt !== undefined &&
    Date.parse(progress.reviewDueAt) <= Date.parse(now)

  function activateTopic() {
    if (state.activeTopicId && state.activeTopicId !== topicId) {
      setSwitchDialogOpen(true)
      return
    }

    dispatch({ type: 'topic/activate', topicId, at: getNow() })
  }

  function confirmSwitch() {
    dispatch({ type: 'topic/activate', topicId, at: getNow() })
    setSwitchDialogOpen(false)
  }

  function completeStep(step: StudyStepId) {
    dispatch({
      type: 'topic/complete-step',
      topicId,
      step,
      at: getNow(),
    })
  }

  function isStepReady(step: StudyStepId) {
    if (
      step === 'firstReview' &&
      progress?.status === 'awaiting_review'
    ) {
      return currentStep === step
    }

    return isActive && currentStep === step
  }

  return (
    <article className="study-page topic-page">
      <header className="study-page__intro topic-page__intro">
        <p className="study-page__eyebrow">
          {route.title} · {module.title}
        </p>
        <h1 ref={titleRef} tabIndex={-1}>
          {topic.title}
        </h1>
        <p className="study-page__lead">{topic.outcome}</p>
        <div className="topic-page__meta">
          <span>{progress ? STATUS_COPY[progress.status] : 'Тема ещё не начата'}</span>
          <span>
            {topic.estimatedMinutes[0]}–{topic.estimatedMinutes[1]} мин
          </span>
        </div>
      </header>

      <section className="topic-why" aria-labelledby="topic-why-title">
        <h2 id="topic-why-title">Почему сейчас</h2>
        <p>{topic.whyNow}</p>
      </section>

      {missingDependencies.length ? (
        <aside
          aria-label="Не завершены зависимости"
          className="dependency-note"
          role="note"
        >
          <strong>Перед этой темой полезно пройти:</strong>
          <ul>
            {missingDependencies.map(({ topic: dependency }) => (
              <li key={dependency.id}>
                <a href={`#/topic/${dependency.id}`}>{dependency.title}</a>
              </li>
            ))}
          </ul>
          <p>Это подсказка, не ограничение: тему можно выбрать сейчас.</p>
        </aside>
      ) : null}

      {progress?.status !== 'mastered' &&
      progress?.status !== 'awaiting_review' &&
      !isActive ? (
        <div className="topic-page__focus-action">
          <Button onClick={activateTopic}>Сделать текущим фокусом</Button>
          <p className="muted-copy">
            Просмотр страницы сам по себе не меняет текущую тему.
          </p>
        </div>
      ) : null}

      <ProgressSteps
        currentStepId={currentStep}
        progress={progress}
        stages={STUDY_STAGES}
      />

      <div className="topic-stages">
        {STUDY_STAGES.map((stage) => {
          const complete = Boolean(progress?.completedSteps[stage.id])
          const current = stage.id === currentStep
          const ready = isStepReady(stage.id)

          if (stage.id === 'source') {
            return (
              <StagePanel
                action={
                  complete ? undefined : (
                    <Button
                      disabled={!ready}
                      onClick={() => completeStep(stage.id)}
                    >
                      {stage.actionLabel}
                    </Button>
                  )
                }
                complete={complete}
                current={current}
                key={stage.id}
                stage={stage}
              >
                <ul className="source-list">
                  <SourceLink label="Основной источник" source={primarySource} />
                  <SourceLink label="Запасной источник" source={fallbackSource} />
                  <SourceLink label="Для практики" source={practiceSource} />
                </ul>
              </StagePanel>
            )
          }

          if (stage.id === 'obsidian') {
            return (
              <StagePanel
                action={
                  complete ? undefined : (
                    <Button
                      disabled={!ready}
                      onClick={() => completeStep(stage.id)}
                    >
                      {stage.actionLabel}
                    </Button>
                  )
                }
                complete={complete}
                current={current}
                key={stage.id}
                stage={stage}
              >
                <ul>
                  {topic.obsidianPrompts.map((prompt) => (
                    <li key={prompt}>{prompt}</li>
                  ))}
                </ul>
                <div className="obsidian-field">
                  <label htmlFor="obsidian-url">
                    Ссылка на заметку в Obsidian (необязательно)
                  </label>
                  <div className="obsidian-field__controls">
                    <input
                      disabled={!ready && !complete}
                      id="obsidian-url"
                      onChange={(event) => setObsidianUrl(event.target.value)}
                      placeholder="obsidian://open?..."
                      type="text"
                      value={obsidianUrl}
                    />
                    <Button
                      disabled={!ready && !complete}
                      onClick={() =>
                        dispatch({
                          type: 'topic/set-obsidian-url',
                          topicId,
                          url: obsidianUrl.trim(),
                        })
                      }
                      variant="secondary"
                    >
                      Сохранить ссылку
                    </Button>
                  </div>
                </div>
              </StagePanel>
            )
          }

          if (stage.id === 'anki') {
            return (
              <StagePanel
                action={
                  complete ? undefined : (
                    <Button
                      disabled={!ready}
                      onClick={() => completeStep(stage.id)}
                    >
                      {stage.actionLabel}
                    </Button>
                  )
                }
                complete={complete}
                current={current}
                key={stage.id}
                stage={stage}
              >
                <ul>
                  {topic.ankiPrompts.map((prompt) => (
                    <li key={prompt}>{prompt}</li>
                  ))}
                </ul>
              </StagePanel>
            )
          }

          if (stage.id === 'practice') {
            return (
              <StagePanel
                action={
                  complete ? undefined : (
                    <Button
                      disabled={!ready || !practiceConfirmed}
                      onClick={() => completeStep(stage.id)}
                    >
                      {stage.actionLabel}
                    </Button>
                  )
                }
                complete={complete}
                current={current}
                key={stage.id}
                stage={stage}
              >
                <fieldset disabled={!ready || complete}>
                  <legend>Практика</legend>
                  {topic.practice.map((task) => (
                    <div className="practice-task" key={task.id}>
                      <h3>{task.title}</h3>
                      <ol>
                        {task.instructions.map((instruction) => (
                          <li key={instruction}>{instruction}</li>
                        ))}
                      </ol>
                      <p>
                        <strong>Минимум:</strong> {task.minimumCompletion}
                      </p>
                      <p className="muted-copy">
                        Около {task.estimatedMinutes} мин
                      </p>
                    </div>
                  ))}
                  <label className="confirmation-check">
                    <input
                      checked={practiceConfirmed}
                      onChange={(event) =>
                        setPracticeConfirmed(event.target.checked)
                      }
                      type="checkbox"
                    />
                    Я выполнил указанный минимум
                  </label>
                </fieldset>
              </StagePanel>
            )
          }

          if (stage.id === 'selfCheck') {
            const allMasteryChecksComplete =
              masteryChecks.length === topic.masteryChecks.length &&
              masteryChecks.every(Boolean)

            return (
              <StagePanel
                action={
                  complete ? undefined : (
                    <Button
                      disabled={!ready || !allMasteryChecksComplete}
                      onClick={() => completeStep(stage.id)}
                    >
                      {stage.actionLabel}
                    </Button>
                  )
                }
                complete={complete}
                current={current}
                key={stage.id}
                stage={stage}
              >
                <fieldset disabled={!ready || complete}>
                  <legend>Проверка понимания</legend>
                  <div className="mastery-checks">
                    {topic.masteryChecks.map((check, index) => (
                      <label className="confirmation-check" key={check}>
                        <input
                          checked={masteryChecks[index] ?? false}
                          onChange={(event) => {
                            const next = [...masteryChecks]
                            next[index] = event.target.checked
                            setMasteryChecks(next)
                          }}
                          type="checkbox"
                        />
                        {check}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </StagePanel>
            )
          }

          return (
            <StagePanel
              action={
                complete ? undefined : (
                  <Button
                    disabled={!ready || !canReview}
                    onClick={() => completeStep(stage.id)}
                  >
                    {stage.actionLabel}
                  </Button>
                )
              }
              complete={complete}
              current={current}
              key={stage.id}
              stage={stage}
            >
              {progress?.reviewDueAt ? (
                <p>
                  Повторение запланировано на{' '}
                  <strong>{formatDate(progress.reviewDueAt)}</strong>.
                  {canReview
                    ? ' Можно начать сейчас.'
                    : ' До этой даты ничего делать не нужно.'}
                </p>
              ) : (
                <p>Дата появится после проверки понимания.</p>
              )}
            </StagePanel>
          )
        })}
      </div>

      <ConfirmDialog
        cancelLabel="Остаться здесь"
        confirmLabel="Переключить тему"
        fallbackFocusRef={titleRef}
        onCancel={() => setSwitchDialogOpen(false)}
        onConfirm={confirmSwitch}
        open={switchDialogOpen}
        title="Переключить текущую тему?"
      >
        <p>
          «{currentActive?.topic.title}» останется приостановленной. Все
          сделанные шаги сохранятся.
        </p>
      </ConfirmDialog>
    </article>
  )
}
