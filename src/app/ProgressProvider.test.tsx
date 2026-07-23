import { StrictMode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createInitialProgress } from '../domain/progress/progressReducer'
import {
  ProgressProvider,
  useProgress,
} from './ProgressProvider'

function ProgressProbe() {
  const { state, dispatch, storageWarning } = useProgress()

  return (
    <>
      <output aria-label="Очередь">{state.queue.join(', ') || 'пусто'}</output>
      <output aria-label="Предупреждение">
        {storageWarning ?? 'нет'}
      </output>
      <button
        type="button"
        onClick={() => dispatch({ type: 'queue/add', topicId: 'event-loop' })}
      >
        Добавить
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'state/reset' })}
      >
        Сбросить
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'state/replace',
            state: {
              ...createInitialProgress(),
              queue: ['call-stack'],
            },
          })
        }
      >
        Импортировать
      </button>
    </>
  )
}

function createStorage(raw: string | null) {
  return {
    getItem: vi.fn((_key: string) => raw),
    setItem: vi.fn((_key: string, _value: string) => undefined),
  }
}

describe('ProgressProvider', () => {
  it('loads progress once and exposes it through context', () => {
    const state = {
      ...createInitialProgress(),
      queue: ['event-loop'],
    }
    const storage = createStorage(JSON.stringify(state))

    render(
      <ProgressProvider storage={storage}>
        <ProgressProbe />
      </ProgressProvider>,
    )

    expect(storage.getItem).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Очередь')).toHaveTextContent('event-loop')
    expect(screen.getByLabelText('Предупреждение')).toHaveTextContent('нет')
  })

  it('does not overwrite loaded progress during the first StrictMode effects', () => {
    const storage = createStorage(JSON.stringify(createInitialProgress()))

    render(
      <StrictMode>
        <ProgressProvider storage={storage}>
          <ProgressProbe />
        </ProgressProvider>
      </StrictMode>,
    )

    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('does not persist in-memory changes over invalid stored data', async () => {
    const user = userEvent.setup()
    const storage = createStorage('{broken')

    render(
      <ProgressProvider storage={storage}>
        <ProgressProbe />
      </ProgressProvider>,
    )

    expect(screen.getByLabelText('Предупреждение')).toHaveTextContent('invalid')

    await user.click(screen.getByRole('button', { name: 'Добавить' }))

    expect(screen.getByLabelText('Очередь')).toHaveTextContent('event-loop')
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Предупреждение')).toHaveTextContent('invalid')
  })

  it.each([
    ['Сбросить', '[]'],
    ['Импортировать', 'call-stack'],
  ])('unlocks persistence after explicit %s', async (action, savedValue) => {
    const user = userEvent.setup()
    const storage = createStorage('{broken')

    render(
      <ProgressProvider storage={storage}>
        <ProgressProbe />
      </ProgressProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Добавить' }))
    await user.click(screen.getByRole('button', { name: action }))

    expect(storage.setItem).toHaveBeenCalledTimes(1)
    expect(storage.setItem.mock.calls[0]?.[1]).toContain(savedValue)
    expect(screen.getByLabelText('Предупреждение')).toHaveTextContent('нет')
  })

  it('keeps the app usable when saving becomes unavailable', async () => {
    const user = userEvent.setup()
    const storage = createStorage(JSON.stringify(createInitialProgress()))
    storage.setItem.mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })

    render(
      <ProgressProvider storage={storage}>
        <ProgressProbe />
      </ProgressProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Добавить' }))

    expect(screen.getByLabelText('Очередь')).toHaveTextContent('event-loop')
    expect(screen.getByLabelText('Предупреждение')).toHaveTextContent(
      'unavailable',
    )
  })
})
