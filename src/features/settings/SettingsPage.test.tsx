import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../app/App'
import { ProgressProvider } from '../../app/ProgressProvider'
import { exportProgress } from '../../domain/progress/importExport'
import { createInitialProgress } from '../../domain/progress/progressReducer'
import type { ProgressState } from '../../domain/progress/types'
import { downloadProgress } from './downloadProgress'
import { SettingsPage } from './SettingsPage'

const NOW = '2026-07-23T12:30:00.000Z'

function createStorage(state = createInitialProgress()) {
  return {
    getItem: vi.fn(() => JSON.stringify(state)),
    setItem: vi.fn(),
  }
}

function renderSettings(state = createInitialProgress()) {
  const storage = createStorage(state)
  const view = render(
    <ProgressProvider storage={storage}>
      <SettingsPage getNow={() => NOW} />
    </ProgressProvider>,
  )

  return { ...view, storage }
}

function backupFile(raw: string) {
  const file = new File([raw], 'backup.json', {
    type: 'application/json',
  })
  Object.defineProperty(file, 'text', {
    configurable: true,
    value: vi.fn().mockResolvedValue(raw),
  })
  return file
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('downloadProgress', () => {
  it('downloads an exact dated JSON filename and revokes the object URL', () => {
    const createObjectURL = vi.fn(() => 'blob:frontend-progress')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    let clicked:
      | { download: string; href: string; connected: boolean }
      | undefined
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function click(this: HTMLAnchorElement) {
        clicked = {
          download: this.download,
          href: this.href,
          connected: this.isConnected,
        }
      },
    )

    downloadProgress(createInitialProgress(), NOW)

    expect(clicked).toEqual({
      download: 'frontend-path-progress-2026-07-23.json',
      href: 'blob:frontend-progress',
      connected: true,
    })
    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'application/json' }),
    )
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:frontend-progress')
    expect(
      document.querySelector(
        'a[download="frontend-path-progress-2026-07-23.json"]',
      ),
    ).not.toBeInTheDocument()
  })

  it('still revokes the object URL when the browser download click fails', () => {
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:frontend-progress',
      revokeObjectURL,
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('download blocked')
    })

    expect(() => downloadProgress(createInitialProgress(), NOW)).toThrow(
      'download blocked',
    )
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:frontend-progress')
    expect(document.querySelector('a[download]')).not.toBeInTheDocument()
  })
})

describe('SettingsPage', () => {
  it('rejects invalid JSON with live feedback and never replaces progress', async () => {
    const user = userEvent.setup()
    const { storage } = renderSettings()

    await user.upload(
      screen.getByLabelText('Файл резервной копии JSON'),
      backupFile('{broken'),
    )

    expect(
      await screen.findByText(
        'Файл повреждён: JSON не удалось прочитать.',
      ),
    ).toBeInTheDocument()
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('lists unknown topic IDs before offering import confirmation', async () => {
    const user = userEvent.setup()
    const { storage } = renderSettings()
    const imported: ProgressState = {
      ...createInitialProgress(),
      topics: {
        'topic-from-an-older-roadmap': {
          status: 'paused',
          completedSteps: {},
          startedAt: '2026-07-20T08:00:00.000Z',
        },
      },
    }

    await user.upload(
      screen.getByLabelText('Файл резервной копии JSON'),
      backupFile(exportProgress(imported, NOW)),
    )

    expect(
      await screen.findByText('topic-from-an-older-roadmap'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Подтвердить импорт' }),
    ).toBeInTheDocument()
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('stages a valid import, offers export first, and replaces only after confirmation', async () => {
    const user = userEvent.setup()
    const current: ProgressState = {
      ...createInitialProgress(),
      queue: ['call-stack'],
    }
    const { storage } = renderSettings(current)

    await user.upload(
      screen.getByLabelText('Файл резервной копии JSON'),
      backupFile(exportProgress(createInitialProgress(), NOW)),
    )

    expect(
      await screen.findByText('Копия проверена и готова к импорту.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Скачать текущую копию перед заменой',
      }),
    ).toBeInTheDocument()
    expect(storage.setItem).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: 'Подтвердить импорт' }),
    )
    expect(
      screen.getByRole('dialog', { name: 'Заменить локальный прогресс?' }),
    ).toBeInTheDocument()
    expect(storage.setItem).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: 'Заменить прогресс' }),
    )

    await waitFor(() => expect(storage.setItem).toHaveBeenCalledTimes(1))
    expect(storage.setItem.mock.calls[0]?.[1]).toBe(
      JSON.stringify(createInitialProgress()),
    )
  })

  it('resets only after a detailed explicit confirmation', async () => {
    const user = userEvent.setup()
    const current: ProgressState = {
      ...createInitialProgress(),
      queue: ['call-stack'],
    }
    const { storage } = renderSettings(current)

    const resetButton = screen.getByRole('button', {
      name: 'Сбросить локальные данные',
    })
    expect(resetButton).toHaveClass('button--secondary')
    await user.click(resetButton)

    const dialog = screen.getByRole('dialog', {
      name: 'Сбросить локальные данные?',
    })
    expect(dialog).toHaveTextContent('локальный прогресс')
    expect(dialog).toHaveTextContent('очередь')
    expect(dialog).toHaveTextContent('ссылки на заметки Obsidian')
    expect(dialog).toHaveTextContent('историю')
    expect(dialog).toHaveTextContent('Встроенная карта тем останется')
    expect(storage.setItem).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(storage.setItem).not.toHaveBeenCalled()

    await user.click(resetButton)
    await user.click(
      screen.getByRole('button', { name: 'Сбросить прогресс' }),
    )

    await waitFor(() => expect(storage.setItem).toHaveBeenCalledTimes(1))
    expect(storage.setItem.mock.calls[0]?.[1]).toBe(
      JSON.stringify(createInitialProgress()),
    )
  })

  it('shows one short storage warning while keeping settings readable', () => {
    window.history.replaceState(null, '', '/#/settings')
    const storage = {
      getItem: vi.fn(() => {
        throw new DOMException('blocked', 'SecurityError')
      }),
      setItem: vi.fn(),
    }

    render(
      <ProgressProvider storage={storage}>
        <App getNow={() => NOW} />
      </ProgressProvider>,
    )

    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Прогресс пока не сохраняется в этом браузере.',
    )
    expect(
      screen.getByRole('heading', { name: 'Настройки', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Roadmap' })).toBeInTheDocument()
  })
})
