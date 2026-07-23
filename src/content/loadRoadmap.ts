import dataFlow from '../../content/roadmap/route-data-flow.json'
import frontendModel from '../../content/roadmap/route-frontend-model.json'
import fullstackDelivery from '../../content/roadmap/route-fullstack-delivery.json'
import meta from '../../content/roadmap/meta.json'
import productionFrontend from '../../content/roadmap/route-production-frontend.json'
import sources from '../../content/roadmap/sources.json'
import supporting from '../../content/roadmap/supporting-lanes.json'
import { buildRoadmapIndex } from '../domain/roadmap/buildRoadmapIndex'
import { validateRoadmap } from '../domain/roadmap/validateRoadmap'

export const roadmap = validateRoadmap({
  contentVersion: 1,
  sources,
  routes: [
    frontendModel,
    dataFlow,
    productionFrontend,
    fullstackDelivery,
  ],
  petProject: supporting.petProject,
  background: supporting.background,
  deferred: supporting.deferred,
  metaSourceRefs: meta.sourceRefs,
})

export const roadmapIndex = buildRoadmapIndex(roadmap)
