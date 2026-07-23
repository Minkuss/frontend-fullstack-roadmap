import type {
  StudyStepId,
  TopicProgress,
} from '../domain/progress/types'

export interface StudyStage {
  id: StudyStepId
  title: string
}

interface ProgressStepsProps {
  currentStepId?: StudyStepId
  progress?: TopicProgress
  stages: readonly StudyStage[]
}

export function ProgressSteps({
  currentStepId,
  progress,
  stages,
}: ProgressStepsProps) {
  return (
    <ol className="progress-steps" aria-label="Этапы учебного цикла">
      {stages.map((stage, index) => {
        const isComplete = Boolean(progress?.completedSteps[stage.id])
        const isCurrent = stage.id === currentStepId
        const stateLabel = isComplete
          ? 'готово'
          : isCurrent
            ? 'текущий шаг'
            : 'позже'

        return (
          <li
            className={[
              'progress-steps__item',
              isComplete ? 'progress-steps__item--complete' : '',
              isCurrent ? 'progress-steps__item--current' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={stage.id}
          >
            <span className="progress-steps__number" aria-hidden="true">
              {isComplete ? '✓' : index + 1}
            </span>
            <span>
              <span className="progress-steps__title">{stage.title}</span>
              <span className="progress-steps__state">{stateLabel}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
