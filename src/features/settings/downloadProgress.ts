import { exportProgress } from '../../domain/progress/importExport'
import type { ProgressState } from '../../domain/progress/types'

export function downloadProgress(state: ProgressState, now: string) {
  const contents = exportProgress(state, now)
  const blob = new Blob([contents], { type: 'application/json' })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.download = `frontend-path-progress-${now.slice(0, 10)}.json`
  anchor.href = objectUrl
  anchor.hidden = true
  document.body.append(anchor)

  try {
    anchor.click()
  } finally {
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }
}
