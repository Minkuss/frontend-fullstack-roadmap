import type {
  LearningSource,
  Roadmap,
  RoadmapIndex,
  RoadmapLane,
  RoadmapModule,
  Topic,
  TopicLocation,
} from './types'

export function buildRoadmapIndex(roadmap: Roadmap): RoadmapIndex {
  const topics = new Map<string, TopicLocation>()
  const modules = new Map<string, RoadmapModule>()
  const sources = new Map<string, LearningSource>()
  const routeIds = new Set<string>()

  roadmap.sources.forEach((source) => {
    if (sources.has(source.id)) {
      throw new Error(`Duplicate source id: ${source.id}`)
    }
    sources.set(source.id, source)
  })

  for (const route of [...roadmap.routes, roadmap.petProject, roadmap.background, roadmap.deferred]) {
    if (routeIds.has(route.id)) {
      throw new Error(`Duplicate route id: ${route.id}`)
    }
    routeIds.add(route.id)

    route.modules.forEach((module) => {
      if (modules.has(module.id)) {
        throw new Error(`Duplicate module id: ${module.id}`)
      }
      modules.set(module.id, module)

      module.topics.forEach((topic) => addTopic(topics, route, module, topic))
    })
  }

  return { topics, modules, sources }
}

function addTopic(
  topics: RoadmapIndex['topics'],
  route: RoadmapLane,
  module: RoadmapModule,
  topic: Topic,
): void {
  if (topics.has(topic.id)) {
    throw new Error(`Duplicate topic id: ${topic.id}`)
  }
  topics.set(topic.id, { route, module, topic })
}

export function findTopic(index: RoadmapIndex, topicId: string): Topic | undefined {
  return index.topics.get(topicId)?.topic
}
