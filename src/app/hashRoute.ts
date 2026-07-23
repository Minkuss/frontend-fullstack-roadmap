import { useSyncExternalStore } from 'react'

export type HashRoute =
  | { page: 'focus' | 'roadmap' | 'progress' | 'settings' }
  | { page: 'topic'; topicId: string }

const STATIC_PAGES = new Set([
  'focus',
  'roadmap',
  'progress',
  'settings',
])

export function parseHash(hash: string): HashRoute {
  const path = hash.replace(/^#/, '')
  const staticMatch = path.match(/^\/([^/]+)\/?$/)

  if (staticMatch && STATIC_PAGES.has(staticMatch[1] ?? '')) {
    return {
      page: staticMatch[1] as 'focus' | 'roadmap' | 'progress' | 'settings',
    }
  }

  const topicMatch = path.match(/^\/topic\/([^/]+)\/?$/)
  if (topicMatch?.[1]) {
    try {
      const topicId = decodeURIComponent(topicMatch[1])
      if (topicId.trim()) {
        return { page: 'topic', topicId }
      }
    } catch {
      // Malformed encoded routes use the calm default screen.
    }
  }

  return { page: 'focus' }
}

function subscribeToHashChange(onStoreChange: () => void) {
  window.addEventListener('hashchange', onStoreChange)
  return () => window.removeEventListener('hashchange', onStoreChange)
}

function getHashSnapshot() {
  return window.location.hash
}

export function useHashRoute(): HashRoute {
  const hash = useSyncExternalStore(
    subscribeToHashChange,
    getHashSnapshot,
    () => '#/focus',
  )

  return parseHash(hash)
}
