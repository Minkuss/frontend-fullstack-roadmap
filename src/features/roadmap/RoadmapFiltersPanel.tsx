import { roadmap } from '../../content/loadRoadmap'
import type { TopicStatus } from '../../domain/progress/types'
import { Button } from '../../ui/Button'
import type {
  DurationFilter,
  RoadmapFilters,
} from './filterRoadmap'

const STATUS_OPTIONS: Array<{
  value: TopicStatus | 'all'
  label: string
}> = [
  { value: 'all', label: 'Все статусы' },
  { value: 'not_started', label: 'Новые' },
  { value: 'active', label: 'В фокусе' },
  { value: 'paused', label: 'Приостановленные' },
  { value: 'awaiting_review', label: 'Первое повторение' },
  { value: 'mastered', label: 'Освоенные' },
]

const DURATION_OPTIONS: Array<{
  value: DurationFilter
  label: string
}> = [
  { value: 'all', label: 'Любая длительность' },
  { value: '10-30', label: '10–30 минут' },
  { value: '31-60', label: '31–60 минут' },
  { value: '61-plus', label: '61+ минут' },
]

interface RoadmapFiltersPanelProps {
  filters: RoadmapFilters
  onChange: (filters: RoadmapFilters) => void
  topicCount: number
}

export function RoadmapFiltersPanel({
  filters,
  onChange,
  topicCount,
}: RoadmapFiltersPanelProps) {
  function chooseRoute(routeId: string | 'all') {
    onChange({
      ...filters,
      routeId,
      includeDeferred: false,
    })
  }

  return (
    <section
      aria-labelledby="roadmap-filters-title"
      className="roadmap-filters"
    >
      <div>
        <p className="study-page__eyebrow">Сузить карту</p>
        <h2 id="roadmap-filters-title">Что посмотреть сейчас</h2>
      </div>

      <div
        aria-label="Маршрут"
        className="roadmap-route-filter"
        role="group"
      >
        <Button
          aria-pressed={filters.routeId === 'all'}
          onClick={() => chooseRoute('all')}
          variant="secondary"
        >
          Все направления
        </Button>
        {roadmap.routes.map((route) => (
          <Button
            aria-pressed={filters.routeId === route.id}
            key={route.id}
            onClick={() => chooseRoute(route.id)}
            variant="secondary"
          >
            {route.title}
          </Button>
        ))}
        <Button
          aria-pressed={filters.includeDeferred}
          onClick={() =>
            onChange({
              ...filters,
              routeId: 'deferred-catalog',
              includeDeferred: true,
            })
          }
          variant="quiet"
        >
          Не сейчас
        </Button>
      </div>

      <div className="roadmap-filter-fields">
        <label>
          <span>Поиск по теме или модулю</span>
          <input
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value })
            }
            type="search"
            value={filters.query}
          />
        </label>
        <label>
          <span>Статус</span>
          <select
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as RoadmapFilters['status'],
              })
            }
            value={filters.status}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Оценка времени</span>
          <select
            onChange={(event) =>
              onChange({
                ...filters,
                duration: event.target.value as RoadmapFilters['duration'],
              })
            }
            value={filters.duration}
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p aria-live="polite" className="roadmap-result-count">
        Найдено тем: {topicCount}
      </p>
    </section>
  )
}
