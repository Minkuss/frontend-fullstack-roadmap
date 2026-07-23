import { expect, test, type Page } from '@playwright/test'

const STORAGE_KEY = 'frontend-path/progress'
const EVENT_LOOP_TITLE = 'Event loop: task и microtask'
const OTHER_ROUTE_TOPIC_TITLE = 'От URL до HTTP-ответа'

const emptyProgress = {
  schemaVersion: 1,
  activeTopicId: null,
  queue: [],
  topics: {},
  history: [],
}

async function seedProgress(page: Page) {
  await page.addInitScript(
    ({ key, state }) => {
      if (window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, JSON.stringify(state))
      }
    },
    { key: STORAGE_KEY, state: emptyProgress },
  )
}

async function expectLogicalHeadings(page: Page) {
  const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll(
    (headings) =>
      headings.map((heading) => Number(heading.tagName.slice(1))),
  )

  expect(levels[0]).toBe(1)
  for (let index = 1; index < levels.length; index += 1) {
    expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1)
  }
}

test('completes, pauses, resumes, and reviews event-loop with keyboard and mobile access', async ({
  page,
}) => {
  await seedProgress(page)
  await page.goto('/#/focus')

  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(
    page.getByRole('navigation', { name: 'Основная навигация' }),
  ).toHaveCount(1)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Фокус ещё не выбран' }),
  ).toBeVisible()
  await expectLogicalHeadings(page)

  const navigation = page.getByRole('navigation', {
    name: 'Основная навигация',
  })
  const focusAction = page.getByRole('button', {
    name: 'Сделать текущим фокусом',
  })

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'К содержанию' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', {
      name: 'Frontend Path — личный маршрут обучения',
    }),
  ).toBeFocused()
  for (const label of ['Фокус', 'Roadmap', 'Прогресс', 'Настройки']) {
    await page.keyboard.press('Tab')
    await expect(navigation.getByRole('link', { name: label })).toBeFocused()
  }
  await page.keyboard.press('Tab')
  await expect(focusAction).toBeFocused()

  await page.goto('/#/topic/event-loop')
  await expect(
    page.getByRole('heading', { level: 1, name: EVENT_LOOP_TITLE }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Сделать текущим фокусом' })
    .click()
  await page.getByRole('button', { name: 'Источник изучен' }).click()

  const obsidianUrl = page.getByRole('textbox', {
    name: 'Ссылка на заметку в Obsidian (необязательно)',
  })
  await obsidianUrl.fill(
    'obsidian://open?vault=my_brain&file=event-loop',
  )
  await page.getByRole('button', { name: 'Сохранить ссылку' }).click()
  await page.getByRole('button', { name: 'Заметка готова' }).click()

  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Карточки созданы' }),
  ).toBeEnabled()
  await expect(obsidianUrl).toHaveValue(
    'obsidian://open?vault=my_brain&file=event-loop',
  )

  await navigation.getByRole('link', { name: 'Roadmap' }).click()
  await page
    .getByRole('group', { name: 'Маршрут' })
    .getByRole('button', { name: 'Надёжный поток данных' })
    .click()
  const httpModule = page.locator('details').filter({
    has: page.getByText('HTTP и сеть', { exact: true }),
  })
  await httpModule.locator('summary').click()
  const otherTopic = httpModule.getByRole('listitem').filter({
    has: page.getByRole('link', { name: OTHER_ROUTE_TOPIC_TITLE }),
  })
  await otherTopic
    .getByRole('button', {
      name: `Сделать фокусом: ${OTHER_ROUTE_TOPIC_TITLE}`,
    })
    .click()
  await page
    .getByRole('dialog', { name: 'Переключить текущую тему?' })
    .getByRole('button', { name: 'Переключить тему' })
    .click()

  await navigation.getByRole('link', { name: 'Прогресс' }).click()
  const pausedTopics = page.getByRole('region', {
    name: 'Приостановлено',
  })
  const pausedEventLoop = pausedTopics.getByRole('link', {
    name: EVENT_LOOP_TITLE,
  })
  await expect(pausedEventLoop).toBeVisible()
  await pausedEventLoop.click()

  await page
    .getByRole('button', { name: 'Сделать текущим фокусом' })
    .click()
  await page
    .getByRole('dialog', { name: 'Переключить текущую тему?' })
    .getByRole('button', { name: 'Переключить тему' })
    .click()
  await expect(page.getByText('Текущий фокус', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Карточки созданы' }).click()
  const practice = page.getByRole('region', { name: 'Практика' })
  await practice
    .getByRole('checkbox', { name: 'Я выполнил указанный минимум' })
    .check()
  await practice
    .getByRole('button', { name: 'Практика выполнена' })
    .click()

  const selfCheck = page.getByRole('region', {
    name: 'Проверка понимания',
  })
  for (const checkbox of await selfCheck.getByRole('checkbox').all()) {
    await checkbox.check()
  }
  await selfCheck
    .getByRole('button', { name: 'Проверка пройдена' })
    .click()
  await expect(
    page.getByText('Ожидает первого повторения', { exact: true }),
  ).toBeVisible()

  await page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      throw new Error('Progress was not persisted')
    }

    const state = JSON.parse(raw)
    state.topics['event-loop'].reviewDueAt =
      '2000-01-01T00:00:00.000Z'
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }, STORAGE_KEY)
  await page.reload()

  const reviewButton = page.getByRole('button', {
    name: 'Первое повторение выполнено',
  })
  await expect(reviewButton).toBeEnabled()
  await reviewButton.click()
  await expect(page.getByText('Тема освоена', { exact: true })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expectLogicalHeadings(page)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          ) <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true)
})
