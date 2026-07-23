# Frontend Path

Локальный интерактивный roadmap для личного обучения frontend-разработке.
Приложение ведёт одну активную тему через цикл: источник → заметка Obsidian →
карточки Anki → практика → проверка понимания → первое повторение.

## Требования

- Node.js `^20.19.0` или `>=22.12.0`
- npm

Текущая рабочая версия при финальной проверке: Node.js `20.19.3`.

## Запуск

```bash
npm ci
npm run dev
```

Vite покажет локальный адрес приложения. Backend и отдельная база данных не
нужны.

## Проверки

```bash
npm test
npm run content:coverage
npm run build
npx playwright install chromium
npm run test:e2e
```

- `npm test` запускает unit- и component-тесты Vitest.
- `npm run content:coverage` проверяет актуальность отчёта и полноту миграции
  исходной карты.
- `npm run build` проверяет TypeScript и создаёт production-сборку.
- `npm run test:e2e` запускает два основных пользовательских сценария в
  Chromium через Playwright.

## Где хранится прогресс

Прогресс хранится только в `localStorage` текущего браузера под ключом
`frontend-path/progress`. Аккаунта, backend, облачной синхронизации и
автоматического доступа к Obsidian или Anki нет.

В разделе «Настройки» можно:

- скачать резервную копию JSON;
- проверить и импортировать копию с явным подтверждением замены;
- сбросить только локальный прогресс.

Повреждённый файл не заменяет текущие данные. Для переноса между браузерами
нужно вручную скачать копию в одном и импортировать её в другом.

## Обновление учебного контента

Источник карты:
`/Users/nikita/Documents/my_brain/personal-frontend-skill-map.md`.

После изменения исходного Markdown:

1. Обновить снимок и инвентарь:

   ```bash
   npm run content:import -- /Users/nikita/Documents/my_brain/personal-frontend-skill-map.md
   ```

2. Распределить новые `sourceRef` по JSON-файлам в `content/roadmap/`. Нельзя
   молча удалять пункты исходной карты.
3. Проверить и при необходимости обновить учебные ссылки в
   `content/roadmap/sources.json`, включая `lastVerifiedAt`.
4. Пересобрать отчёт:

   ```bash
   node scripts/check-content-coverage.mjs
   ```

5. Запустить контроль:

   ```bash
   npm run content:coverage
   npm test
   npm run build
   npm run test:e2e
   ```

Текущий отчёт [docs/content-coverage.md](docs/content-coverage.md) фиксирует
все 1338 элементов исходной карты: `0` нераспределённых и `0` неизвестных
ссылок. Все 205 учебных источников последний раз проверены `2026-07-23`.
