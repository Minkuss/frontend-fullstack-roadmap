import type { ReactNode } from 'react'
import type { RoadmapLane } from '../../domain/roadmap/types'

interface RoadmapLaneSectionProps {
  lane: RoadmapLane
  renderTopic: (topicId: string) => ReactNode
}

export function RoadmapLaneSection({
  lane,
  renderTopic,
}: RoadmapLaneSectionProps) {
  return (
    <section
      aria-labelledby={`roadmap-lane-${lane.id}`}
      className="roadmap-lane"
    >
      <header className="roadmap-lane__intro">
        <h2 id={`roadmap-lane-${lane.id}`}>{lane.title}</h2>
        <p>{lane.outcome}</p>
      </header>

      <div className="roadmap-modules">
        {lane.modules.map((module) => (
          <details className="roadmap-module" key={module.id}>
            <summary>
              <span>{module.title}</span>
              <small>
                {module.topics.length}{' '}
                {module.topics.length === 1 ? 'тема' : 'тем'}
              </small>
            </summary>
            <div className="roadmap-module__body">
              <p>{module.outcome}</p>
              <ul className="roadmap-topic-list">
                {module.topics.map((topic) => renderTopic(topic.id))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
