import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import { progressReducer } from '../domain/progress/progressReducer'
import {
  loadProgress,
  saveProgress,
} from '../domain/progress/storage'
import type {
  ProgressAction,
  ProgressState,
} from '../domain/progress/types'

export type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>

interface ProgressContextValue {
  state: ProgressState
  dispatch: Dispatch<ProgressAction>
  storageWarning?: 'unavailable' | 'invalid'
}

interface ProgressProviderProps {
  children: ReactNode
  storage?: ProgressStorage
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

const unavailableStorage: ProgressStorage = {
  getItem() {
    throw new Error('Storage is unavailable')
  },
  setItem() {
    throw new Error('Storage is unavailable')
  },
}

function getBrowserStorage(): ProgressStorage {
  try {
    return window.localStorage
  } catch {
    return unavailableStorage
  }
}

export function ProgressProvider({
  children,
  storage,
}: ProgressProviderProps) {
  const [storageAdapter] = useState(() => storage ?? getBrowserStorage())
  const [initialLoad] = useState(() => loadProgress(storageAdapter))
  const [state, dispatch] = useReducer(progressReducer, initialLoad.state)
  const [storageWarning, setStorageWarning] = useState(initialLoad.warning)
  const previousState = useRef(state)

  useEffect(() => {
    if (previousState.current === state) {
      return
    }

    previousState.current = state
    const result = saveProgress(storageAdapter, state)
    setStorageWarning(result.ok ? undefined : 'unavailable')
  }, [state, storageAdapter])

  const value = useMemo(
    () => ({ state, dispatch, storageWarning }),
    [state, storageWarning],
  )

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const context = useContext(ProgressContext)

  if (!context) {
    throw new Error('useProgress must be used inside ProgressProvider')
  }

  return context
}
