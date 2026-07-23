import { describe, expect, it } from 'vitest'

import { roadmap, roadmapIndex } from './loadRoadmap'

describe('loadRoadmap', () => {
  it('composes four primary routes in learning order', () => {
    expect(roadmap.routes.map(({ id }) => id)).toEqual([
      'frontend-model',
      'data-flow',
      'production-frontend',
      'fullstack-delivery',
    ])
  })

  it('exposes each supporting lane kind', () => {
    expect(roadmap.petProject.kind).toBe('pet-project')
    expect(roadmap.background.kind).toBe('background')
    expect(roadmap.deferred.kind).toBe('deferred')
  })

  it('indexes every lane from the complete roadmap', () => {
    const topicCount = [
      ...roadmap.routes,
      roadmap.petProject,
      roadmap.background,
      roadmap.deferred,
    ].flatMap((lane) => lane.modules.flatMap((module) => module.topics)).length

    expect(roadmapIndex.topics.size).toBe(topicCount)
  })
})
