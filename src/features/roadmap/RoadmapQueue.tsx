import { roadmapIndex } from '../../content/loadRoadmap'
import { Button } from '../../ui/Button'

interface RoadmapQueueProps {
  onRemove: (topicId: string) => void
  queue: string[]
}

export function RoadmapQueue({
  onRemove,
  queue,
}: RoadmapQueueProps) {
  const topics = queue.flatMap((topicId) => {
    const topic = roadmapIndex.topics.get(topicId)?.topic
    return topic ? [topic] : []
  })

  return (
    <section
      aria-label="Личная очередь"
      className="roadmap-queue"
      role="region"
    >
      <div>
        <p className="study-page__eyebrow">После текущей темы</p>
        <h2>Личная очередь</h2>
      </div>
      {topics.length ? (
        <ol className="roadmap-queue__list">
          {topics.map((topic, index) => (
            <li
              className={
                index < 3 ? 'roadmap-queue__item--near' : undefined
              }
              key={topic.id}
            >
              <div>
                {index < 3 ? (
                  <strong className="roadmap-queue__priority">
                    Ближайшая №{index + 1}
                  </strong>
                ) : null}
                <a href={`#/topic/${topic.id}`}>{topic.title}</a>
              </div>
              <Button
                aria-label={`Убрать из очереди: ${topic.title}`}
                onClick={() => onRemove(topic.id)}
                variant="quiet"
              >
                Убрать
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted-copy">
          Пусто. Добавляй только темы, к которым хочется вернуться скоро.
        </p>
      )}
    </section>
  )
}
