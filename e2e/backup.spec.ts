import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const STORAGE_KEY = 'frontend-path/progress'
const EVENT_LOOP_TITLE = 'Event loop: task и microtask'

const masteredProgress = {
  schemaVersion: 1,
  activeTopicId: null,
  queue: [],
  topics: {
    'event-loop': {
      status: 'mastered',
      completedSteps: {
        source: '2026-07-17T08:00:00.000Z',
        obsidian: '2026-07-17T09:00:00.000Z',
        anki: '2026-07-17T10:00:00.000Z',
        practice: '2026-07-17T11:00:00.000Z',
        selfCheck: '2026-07-17T12:00:00.000Z',
        firstReview: '2026-07-20T12:00:00.000Z',
      },
      obsidianUrl: 'obsidian://open?vault=my_brain&file=event-loop',
      reviewDueAt: '2026-07-20T12:00:00.000Z',
      startedAt: '2026-07-17T07:00:00.000Z',
      masteredAt: '2026-07-20T12:00:00.000Z',
    },
  },
  history: [],
}

async function seedMasteredProgress(page: Page) {
  await page.addInitScript(
    ({ key, state }) => {
      if (window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, JSON.stringify(state))
      }
    },
    { key: STORAGE_KEY, state: masteredProgress },
  )
}

test('exports, resets, restores, and rejects a malformed backup without data loss', async ({
  page,
}) => {
  await seedMasteredProgress(page)
  await page.goto('/#/settings')

  const downloadPromise = page.waitForEvent('download')
  await page
    .getByRole('button', { name: 'Скачать резервную копию' })
    .click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(
    /^frontend-path-progress-\d{4}-\d{2}-\d{2}\.json$/,
  )
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()
  const exportedText = await readFile(downloadPath!, 'utf8')
  expect(JSON.parse(exportedText).progress.topics['event-loop'].status).toBe(
    'mastered',
  )

  await page
    .getByRole('button', { name: 'Сбросить локальные данные' })
    .click()
  await page
    .getByRole('dialog', { name: 'Сбросить локальные данные?' })
    .getByRole('button', { name: 'Сбросить прогресс' })
    .click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Локальные данные сброшены.' }),
  ).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Основная навигация' })
    .getByRole('link', { name: 'Прогресс' })
    .click()
  await expect(
    page
      .getByRole('region', { name: 'Освоено' })
      .getByRole('link', { name: EVENT_LOOP_TITLE }),
  ).toHaveCount(0)

  await page
    .getByRole('navigation', { name: 'Основная навигация' })
    .getByRole('link', { name: 'Настройки' })
    .click()
  const backupInput = page.getByLabel('Файл резервной копии JSON')
  await backupInput.setInputFiles({
    name: 'frontend-path-progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exportedText),
  })
  await expect(
    page.getByRole('status').filter({
      hasText: 'Копия проверена и готова к импорту.',
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Подтвердить импорт' }).click()
  await page
    .getByRole('dialog', { name: 'Заменить локальный прогресс?' })
    .getByRole('button', { name: 'Заменить прогресс' })
    .click()
  await expect(
    page.getByRole('status').filter({
      hasText: 'Локальный прогресс восстановлен из копии.',
    }),
  ).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Основная навигация' })
    .getByRole('link', { name: 'Прогресс' })
    .click()
  const masteredTopic = page
    .getByRole('region', { name: 'Освоено' })
    .getByRole('link', { name: EVENT_LOOP_TITLE })
  await expect(masteredTopic).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Основная навигация' })
    .getByRole('link', { name: 'Настройки' })
    .click()
  const persistedBeforeInvalidImport = await page.evaluate((storageKey) => {
    return window.localStorage.getItem(storageKey)
  }, STORAGE_KEY)
  await page.getByLabel('Файл резервной копии JSON').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  })
  await expect(
    page.getByRole('status').filter({
      hasText: 'Файл повреждён: JSON не удалось прочитать.',
    }),
  ).toBeVisible()
  const persistedAfterInvalidImport = await page.evaluate((storageKey) => {
    return window.localStorage.getItem(storageKey)
  }, STORAGE_KEY)
  expect(persistedAfterInvalidImport).toBe(persistedBeforeInvalidImport)

  await page
    .getByRole('navigation', { name: 'Основная навигация' })
    .getByRole('link', { name: 'Прогресс' })
    .click()
  await expect(masteredTopic).toBeVisible()
})
