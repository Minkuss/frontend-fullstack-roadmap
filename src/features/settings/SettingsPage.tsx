import { useRef, useState, type ChangeEvent } from 'react'
import { useProgress } from '../../app/ProgressProvider'
import { roadmapIndex } from '../../content/loadRoadmap'
import {
  parseProgressImport,
  type ImportResult,
} from '../../domain/progress/importExport'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { downloadProgress } from './downloadProgress'

interface SettingsPageProps {
  getNow: () => string
}

type ValidImport = Extract<ImportResult, { ok: true }>

const IMPORT_ERRORS: Record<
  Extract<ImportResult, { ok: false }>['reason'],
  string
> = {
  'invalid-json': 'Файл повреждён: JSON не удалось прочитать.',
  'invalid-format': 'Это не резервная копия Frontend Path.',
  'invalid-progress': 'В копии повреждены данные прогресса.',
}

export function SettingsPage({ getNow }: SettingsPageProps) {
  const { state, dispatch } = useProgress()
  const [feedback, setFeedback] = useState<string>()
  const [stagedImport, setStagedImport] = useState<ValidImport>()
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const importRequestId = useRef(0)
  const importFileRef = useRef<HTMLInputElement>(null)
  const resetRef = useRef<HTMLButtonElement>(null)

  function exportCurrentProgress() {
    downloadProgress(state, getNow())
  }

  async function stageImport(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    const requestId = ++importRequestId.current
    setFeedback(undefined)
    setStagedImport(undefined)

    if (!file) {
      return
    }

    try {
      const raw = await file.text()
      if (requestId !== importRequestId.current) {
        return
      }

      const result = parseProgressImport(raw, roadmapIndex)
      if (!result.ok) {
        setFeedback(IMPORT_ERRORS[result.reason])
        return
      }

      setStagedImport(result)
      setFeedback('Копия проверена и готова к импорту.')
    } catch {
      if (requestId === importRequestId.current) {
        setFeedback('Не удалось прочитать выбранный файл.')
      }
    } finally {
      if (requestId === importRequestId.current) {
        input.value = ''
      }
    }
  }

  function confirmImport() {
    if (!stagedImport) {
      return
    }

    dispatch({ type: 'state/replace', state: stagedImport.state })
    setStagedImport(undefined)
    setImportDialogOpen(false)
    setFeedback('Локальный прогресс восстановлен из копии.')
  }

  function confirmReset() {
    dispatch({ type: 'state/reset' })
    setResetDialogOpen(false)
    setStagedImport(undefined)
    setFeedback('Локальные данные сброшены.')
  }

  return (
    <section className="study-page settings-page">
      <header className="study-page__intro">
        <p className="study-page__eyebrow">Локальные данные</p>
        <h1>Настройки</h1>
        <p className="study-page__lead">
          Прогресс остаётся в этом браузере. Резервная копия позволяет
          перенести или вернуть его вручную.
        </p>
      </header>

      <section
        aria-labelledby="settings-export-title"
        className="settings-section"
      >
        <div>
          <h2 id="settings-export-title">Резервная копия</h2>
          <p>
            Скачай JSON с прогрессом, очередью, ссылками Obsidian и историей.
          </p>
        </div>
        <Button onClick={exportCurrentProgress} variant="secondary">
          Скачать резервную копию
        </Button>
      </section>

      <section
        aria-labelledby="settings-import-title"
        className="settings-section"
      >
        <div>
          <h2 id="settings-import-title">Восстановление</h2>
          <p>
            Сначала файл проверяется. Текущие данные не меняются без
            подтверждения.
          </p>
        </div>
        <label className="file-field" htmlFor="progress-backup">
          <span>Файл резервной копии JSON</span>
          <input
            accept="application/json,.json"
            id="progress-backup"
            onChange={stageImport}
            ref={importFileRef}
            type="file"
          />
        </label>

        {feedback ? (
          <p aria-live="polite" className="settings-feedback" role="status">
            {feedback}
          </p>
        ) : null}

        {stagedImport ? (
          <div className="import-review">
            {stagedImport.unknownTopicIds.length ? (
              <>
                <p>
                  В копии есть темы из другой версии карты. Они сохранятся в
                  данных, но не появятся в текущей карте:
                </p>
                <ul>
                  {stagedImport.unknownTopicIds.map((topicId) => (
                    <li key={topicId}>
                      <code>{topicId}</code>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>Все темы из копии найдены в текущей карте.</p>
            )}
            <div className="settings-actions">
              <Button onClick={exportCurrentProgress} variant="quiet">
                Скачать текущую копию перед заменой
              </Button>
              <Button
                onClick={() => setImportDialogOpen(true)}
                variant="secondary"
              >
                Подтвердить импорт
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section
        aria-labelledby="settings-reset-title"
        className="settings-section settings-section--reset"
      >
        <div>
          <h2 id="settings-reset-title">Начать прогресс заново</h2>
          <p>
            Карта тем встроена в приложение и не зависит от локального
            прогресса.
          </p>
        </div>
        <Button
          onClick={() => setResetDialogOpen(true)}
          ref={resetRef}
          variant="secondary"
        >
          Сбросить локальные данные
        </Button>
      </section>

      <ConfirmDialog
        confirmLabel="Заменить прогресс"
        confirmVariant="secondary"
        fallbackFocusRef={importFileRef}
        onCancel={() => setImportDialogOpen(false)}
        onConfirm={confirmImport}
        open={importDialogOpen}
        title="Заменить локальный прогресс?"
      >
        <p>
          Импорт заменит текущий локальный прогресс, очередь, ссылки Obsidian
          и историю данными из выбранной копии.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        confirmLabel="Сбросить прогресс"
        confirmVariant="secondary"
        fallbackFocusRef={resetRef}
        onCancel={() => setResetDialogOpen(false)}
        onConfirm={confirmReset}
        open={resetDialogOpen}
        title="Сбросить локальные данные?"
      >
        <p>
          Будут удалены локальный прогресс, очередь, ссылки на заметки
          Obsidian и историю. Встроенная карта тем останется на месте.
        </p>
      </ConfirmDialog>
    </section>
  )
}
