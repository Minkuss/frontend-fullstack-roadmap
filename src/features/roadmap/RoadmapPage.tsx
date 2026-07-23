import {
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useProgress } from '../../app/ProgressProvider'
import {
  roadmap,
  roadmapIndex,
} from '../../content/loadRoadmap'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { EmptyState } from '../../ui/EmptyState'
import {
  filterRoadmap,
  type RoadmapFilters,
} from './filterRoadmap'
import { RoadmapFiltersPanel } from './RoadmapFiltersPanel'
import { RoadmapLaneSection } from './RoadmapLaneSection'
import { RoadmapQueue } from './RoadmapQueue'
import { RoadmapTopicRow } from './RoadmapTopicRow'

interface RoadmapPageProps {
  getNow: () => string
}

const ALL_LANES = [
  ...roadmap.routes,
  roadmap.petProject,
  roadmap.background,
  roadmap.deferred,
]

const INITIAL_FILTERS: RoadmapFilters = {
  status: 'all',
  routeId: 'all',
  duration: 'all',
  query: '',
  includeDeferred: false,
}

export function RoadmapPage({ getNow }: RoadmapPageProps) {
  const { state, dispatch } = useProgress()
  const [filters, setFilters] =
    useState<RoadmapFilters>(INITIAL_FILTERS)
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(
    null,
  )
  const pageTitleRef = useRef<HTMLHeadingElement>(null)
  const topicLinkRefs = useRef(new Map<string, HTMLAnchorElement>())
  const activationFocusIdRef = useRef<string | null>(null)
  const dialogFallbackRef = useRef<HTMLElement | null>(null)
  const filteredLanes = filterRoadmap(ALL_LANES, state, filters)
  const visibleTopicCount = filteredLanes.reduce(
    (laneCount, lane) =>
      laneCount +
      lane.modules.reduce(
        (moduleCount, module) => moduleCount + module.topics.length,
        0,
      ),
    0,
  )
  const currentActive = state.activeTopicId
    ? roadmapIndex.topics.get(state.activeTopicId)
    : undefined

  useLayoutEffect(() => {
    const topicId = activationFocusIdRef.current
    if (!topicId || state.activeTopicId !== topicId) {
      return
    }

    const topicLink = topicLinkRefs.current.get(topicId)
    const target =
      topicLink?.isConnected === true ? topicLink : pageTitleRef.current

    dialogFallbackRef.current = target
    target?.focus()
    activationFocusIdRef.current = null
  }, [state.activeTopicId])

  function prepareActivationFocus(topicId: string) {
    activationFocusIdRef.current = topicId
    const topicLink = topicLinkRefs.current.get(topicId)
    dialogFallbackRef.current =
      topicLink?.isConnected === true ? topicLink : pageTitleRef.current
  }

  function requestFocus(topicId: string) {
    prepareActivationFocus(topicId)

    if (state.activeTopicId && state.activeTopicId !== topicId) {
      setPendingFocusId(topicId)
      return
    }

    dispatch({ type: 'topic/activate', topicId, at: getNow() })
  }

  function confirmFocus() {
    if (!pendingFocusId) {
      return
    }

    dispatch({
      type: 'topic/activate',
      topicId: pendingFocusId,
      at: getNow(),
    })
    setPendingFocusId(null)
  }

  function cancelFocus() {
    activationFocusIdRef.current = null
    setPendingFocusId(null)
  }

  return (
    <section className="study-page roadmap-page">
      <header className="study-page__intro">
        <p className="study-page__eyebrow">Вся карта</p>
        <h1 ref={pageTitleRef} tabIndex={-1}>
          Roadmap
        </h1>
        <p className="study-page__lead">
          Четыре маршрута доступны одновременно. Можно сменить направление
          в любой момент — завершать предыдущий маршрут не нужно.
        </p>
      </header>

      <RoadmapQueue
        onRemove={(topicId) =>
          dispatch({ type: 'queue/remove', topicId })
        }
        queue={state.queue}
      />

      <RoadmapFiltersPanel
        filters={filters}
        onChange={setFilters}
        topicCount={visibleTopicCount}
      />

      {filteredLanes.length ? (
        <div className="roadmap-lanes">
          {filteredLanes.map((lane) => (
            <RoadmapLaneSection
              key={lane.id}
              lane={lane}
              renderTopic={(topicId) => {
                const topic = roadmapIndex.topics.get(topicId)?.topic
                return topic ? (
                  <RoadmapTopicRow
                    index={roadmapIndex}
                    key={topic.id}
                    onFocus={requestFocus}
                    onQueueAdd={(queuedId) =>
                      dispatch({ type: 'queue/add', topicId: queuedId })
                    }
                    onQueueRemove={(queuedId) =>
                      dispatch({
                        type: 'queue/remove',
                        topicId: queuedId,
                      })
                    }
                    progress={state}
                    topic={topic}
                    topicLinkRef={(element) => {
                      if (element) {
                        topicLinkRefs.current.set(topic.id, element)
                      } else {
                        topicLinkRefs.current.delete(topic.id)
                      }
                    }}
                  />
                ) : null
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="По этим фильтрам тем нет">
          Измени поиск, статус или оценку времени. Прогресс не изменился.
        </EmptyState>
      )}

      <ConfirmDialog
        cancelLabel="Остаться здесь"
        confirmLabel="Переключить тему"
        fallbackFocusRef={dialogFallbackRef}
        onCancel={cancelFocus}
        onConfirm={confirmFocus}
        open={pendingFocusId !== null}
        title="Переключить текущую тему?"
      >
        <p>
          «{currentActive?.topic.title}» останется приостановленной. Все
          сделанные шаги сохранятся.
        </p>
      </ConfirmDialog>
    </section>
  )
}
