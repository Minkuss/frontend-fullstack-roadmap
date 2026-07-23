export type LaneKind =
  | 'primary-route'
  | 'pet-project'
  | 'background'
  | 'deferred'

export type SourceFormat =
  | 'documentation'
  | 'guide'
  | 'article'
  | 'course'
  | 'video'
  | 'exercise'

export type TopicPriority =
  | 'critical'
  | 'high'
  | 'supporting'
  | 'background'
  | 'deferred'

export interface LearningSource {
  id: string
  title: string
  url: string
  language: 'ru' | 'en'
  format: SourceFormat
  lastVerifiedAt: string
  section?: string
  englishReason?: string
}

export interface PracticeTask {
  id: string
  title: string
  instructions: string[]
  minimumCompletion: string
  estimatedMinutes: number
}

export interface Topic {
  id: string
  title: string
  outcome: string
  whyNow: string
  priority: TopicPriority
  recommendationWeight: number
  estimatedMinutes: [number, number]
  dependencies: string[]
  sourceIds: {
    primary: string
    fallback?: string
    practice?: string
  }
  obsidianPrompts: string[]
  ankiPrompts: string[]
  practice: PracticeTask[]
  masteryChecks: string[]
  quickSteps: string[]
  sourceRefs: string[]
}

export interface RoadmapModule {
  id: string
  title: string
  outcome: string
  topics: Topic[]
  sourceRefs: string[]
}

export interface RoadmapLane {
  id: string
  kind: LaneKind
  order: number
  title: string
  outcome: string
  modules: RoadmapModule[]
  sourceRefs: string[]
}

export interface Roadmap {
  contentVersion: number
  sources: LearningSource[]
  routes: RoadmapLane[]
  petProject: RoadmapLane
  background: RoadmapLane
  deferred: RoadmapLane
  metaSourceRefs: string[]
}

export interface TopicLocation {
  route: RoadmapLane
  module: RoadmapModule
  topic: Topic
}

export interface RoadmapIndex {
  topics: Map<string, TopicLocation>
  modules: Map<string, RoadmapModule>
  sources: Map<string, LearningSource>
}
