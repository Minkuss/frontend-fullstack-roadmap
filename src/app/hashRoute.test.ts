import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { parseHash, useHashRoute } from './hashRoute'

describe('parseHash', () => {
  it('parses a topic route', () => {
    expect(parseHash('#/topic/event-loop')).toEqual({
      page: 'topic',
      topicId: 'event-loop',
    })
  })

  it('falls back to focus for unknown and incomplete routes', () => {
    expect(parseHash('#/unknown')).toEqual({ page: 'focus' })
    expect(parseHash('#/topic/')).toEqual({ page: 'focus' })
  })

  it.each(['focus', 'roadmap', 'progress', 'settings'] as const)(
    'parses the %s page',
    (page) => {
      expect(parseHash(`#/${page}`)).toEqual({ page })
    },
  )
})

describe('useHashRoute', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/#/focus')
  })

  it('reacts to browser hash changes', () => {
    const { result } = renderHook(() => useHashRoute())

    act(() => {
      window.history.replaceState(null, '', '/#/progress')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    expect(result.current).toEqual({ page: 'progress' })
  })
})
