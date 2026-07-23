import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const expectedCounts = { h1: 27, h2: 90, unordered: 1175, ordered: 46 }
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export function parseSourceMap(markdown) {
  let h1 = null
  let h2 = null
  const counts = { h1: 0, h2: 0, unordered: 0, ordered: 0 }
  const items = []

  markdown.split(/\r?\n/).forEach((lineText, index) => {
    const line = index + 1
    const id = `L${String(line).padStart(4, '0')}`
    const h1Match = lineText.match(/^# ([^#].*)$/)
    const h2Match = lineText.match(/^## ([^#].*)$/)
    const unorderedMatch = lineText.match(/^- (.+)$/)
    const orderedMatch = lineText.match(/^\d+\. (.+)$/)

    if (h1Match) {
      h1 = h1Match[1]
      h2 = null
      counts.h1 += 1
      items.push({ id, line, kind: 'h1', text: h1, h1, h2 })
    } else if (h2Match) {
      h2 = h2Match[1]
      counts.h2 += 1
      items.push({ id, line, kind: 'h2', text: h2, h1, h2 })
    } else if (unorderedMatch || orderedMatch) {
      const kind = unorderedMatch ? 'unordered' : 'ordered'
      counts[kind] += 1
      items.push({
        id,
        line,
        kind,
        text: (unorderedMatch ?? orderedMatch)[1],
        h1,
        h2,
      })
    }
  })

  return { counts, items }
}

export async function importSourceMap(sourcePath) {
  if (!sourcePath) {
    throw new Error('Usage: node scripts/import-source-map.mjs <source-path>')
  }

  const markdown = await readFile(sourcePath, 'utf8')
  const parsed = parseSourceMap(markdown)
  const checksum = createHash('sha256').update(markdown).digest('hex')
  const sourceDirectory = resolve(repositoryRoot, 'content/source')
  const inventory = { checksum, counts: parsed.counts, items: parsed.items }

  await mkdir(sourceDirectory, { recursive: true })
  await Promise.all([
    writeFile(resolve(sourceDirectory, 'personal-frontend-skill-map.md'), markdown, 'utf8'),
    writeFile(resolve(sourceDirectory, 'inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`, 'utf8'),
  ])

  const summary = Object.entries(parsed.counts)
    .map(([kind, count]) => `${kind}=${count}`)
    .join(' ')
  console.log(summary)

  if (Object.entries(expectedCounts).some(([kind, count]) => parsed.counts[kind] !== count)) {
    throw new Error(`Source inventory does not match baseline: expected h1=27 h2=90 unordered=1175 ordered=46; observed ${summary}`)
  }

  return inventory
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await importSourceMap(process.argv[2])
}
