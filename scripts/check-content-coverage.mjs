import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const inventoryPath = resolve(repositoryRoot, 'content/source/inventory.json')
const roadmapDirectory = resolve(repositoryRoot, 'content/roadmap')
const reportPath = resolve(repositoryRoot, 'docs/content-coverage.md')

async function findJsonFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true })
    const paths = await Promise.all(
      entries.map((entry) => {
        const entryPath = resolve(directory, entry.name)
        return entry.isDirectory()
          ? findJsonFiles(entryPath)
          : entry.isFile() && entry.name.endsWith('.json')
            ? [entryPath]
            : []
      }),
    )
    return paths.flat().sort()
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

function collectSourceRefs(value, refs = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSourceRefs(item, refs))
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      if (key === 'sourceRefs' && Array.isArray(item)) {
        refs.push(...item)
      } else {
        collectSourceRefs(item, refs)
      }
    })
  }
  return refs
}

function createReport(inventory, refs) {
  const inventoryIds = new Set(inventory.items.map((item) => item.id))
  const referenceCounts = new Map()
  refs.forEach((ref) => referenceCounts.set(ref, (referenceCounts.get(ref) ?? 0) + 1))

  const assigned = [...inventoryIds].filter((id) => referenceCounts.has(id)).length
  const orphaned = inventoryIds.size - assigned
  const unknown = [...referenceCounts].filter(([ref]) => !inventoryIds.has(ref)).length
  const duplicated = [...referenceCounts.values()].reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  )

  const report = [
    '# Content Coverage',
    '',
    `- Source checksum: \`${inventory.checksum}\``,
    `- Inventory items: ${inventoryIds.size}`,
    `- Assigned items: ${assigned}`,
    `- Orphaned items: ${orphaned}`,
    `- Unknown references: ${unknown}`,
    `- Duplicate assignments: ${duplicated}`,
    '',
  ].join('\n')

  return { report, orphaned, unknown }
}

export async function checkContentCoverage({ check = false } = {}) {
  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'))
  const roadmapFiles = await findJsonFiles(roadmapDirectory)
  const roadmapDocuments = await Promise.all(
    roadmapFiles.map(async (path) => JSON.parse(await readFile(path, 'utf8'))),
  )
  const { report, orphaned, unknown } = createReport(
    inventory,
    roadmapDocuments.flatMap((document) => collectSourceRefs(document)),
  )

  if (check) {
    let currentReport = null
    try {
      currentReport = await readFile(reportPath, 'utf8')
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    if (currentReport !== report) {
      console.error('Content coverage report is stale. Run: node scripts/check-content-coverage.mjs')
      process.exitCode = 1
    }
  } else {
    await writeFile(reportPath, report, 'utf8')
  }

  console.log(report)

  if (orphaned > 0 || unknown > 0) {
    process.exitCode = 1
  }

  return { report, orphaned, unknown }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await checkContentCoverage({ check: process.argv.includes('--check') })
}
