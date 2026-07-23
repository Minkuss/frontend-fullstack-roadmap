import { describe, expect, it } from 'vitest'

import inventoryJson from '../../content/source/inventory.json'
import { roadmap } from './loadRoadmap'

function collectSourceRefs(value: unknown, refs: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSourceRefs(item, refs))
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      if (
        (key === 'sourceRefs' || key === 'metaSourceRefs') &&
        Array.isArray(item)
      ) {
        refs.push(...item)
      } else {
        collectSourceRefs(item, refs)
      }
    })
  }
  return refs
}

function createCoverageReport() {
  const inventoryIds = new Set(inventoryJson.items.map((item) => item.id))
  const assignedIds = new Set(collectSourceRefs(roadmap))

  return {
    inventoryItems: inventoryIds.size,
    orphaned: [...inventoryIds].filter((id) => !assignedIds.has(id)),
    unknown: [...assignedIds].filter((id) => !inventoryIds.has(id)),
  }
}

describe('source-map coverage', () => {
  it('assigns every inventory item without inventing references', () => {
    const report = createCoverageReport()

    expect(report.inventoryItems).toBe(1338)
    expect(report.orphaned).toEqual([])
    expect(report.unknown).toEqual([])
  })
})
