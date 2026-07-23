# Frontend Learning Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first React application that converts the complete personal frontend skill map into a calm, pull-based learning system with curated resources, Obsidian/Anki steps, practice, first-review reminders, free route switching, and recoverable progress.

**Architecture:** Ship a small static React + TypeScript + Vite SPA for one user. Keep roadmap content in reviewed JSON files, core learning behavior in plain TypeScript functions, and progress in `localStorage` with manual JSON backup. Generate a source inventory from the original Markdown and fail coverage checks whenever any heading or list item is not assigned to a roadmap entity or explicit metadata/deferred bucket.

**Tech Stack:** Node.js 20.19.3, npm 11.4.2, React 19, TypeScript, Vite 8, Vitest 4, React Testing Library, jsdom, Playwright 1.61, plain CSS, JSON content.

## Global Constraints

- Repository root: `/Users/nikita/Documents/frontend-roadmap`.
- This is a personal single-user learning app. Prefer the smallest clear implementation; do not add production infrastructure, enterprise abstractions, CI branches, telemetry, or generalized extension points.
- Source map: `/Users/nikita/Documents/my_brain/personal-frontend-skill-map.md`.
- Source baseline: 27 level-one headings, 90 level-two headings, 1175 unordered list items, 46 ordered list items.
- Vite 8 requires Node.js `^20.19.0 || >=22.12.0`; current Node.js `20.19.3` is supported.
- No backend, account, cloud sync, OS notification, Obsidian file access, Anki API, or AI recommendation in MVP.
- One active topic at a time. Route and topic browsing remain unrestricted.
- Missing prerequisites warn; they never hard-lock a topic.
- Show one primary resource, at most one fallback resource, and at most one practice resource per topic.
- Prefer Russian resources; use English when materially more accurate, current, or official.
- Schedule one first review three calendar days after self-check. Anki owns later repetition.
- Store progress locally with one current schema version and JSON export/import. No migration framework is required for MVP.
- Never show calendar debt, overdue-red states, streak pressure, confetti, or punitive copy.
- Visual direction: warm paper background, olive-graphite text, terracotta primary action, editorial headings, restrained borders.
- Support keyboard use, visible focus, sufficient contrast, responsive layouts, and `prefers-reduced-motion`.
- Every task follows TDD: failing test, observed failure, minimal implementation, passing test, focused commit.

## File Map

### Project foundation

- `package.json` — scripts and dependencies.
- `package-lock.json` — reproducible dependency graph.
- `index.html` — Vite entry document.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — strict TypeScript configuration.
- `vite.config.ts` — Vite and Vitest configuration.
- `playwright.config.ts` — Chromium E2E configuration with Vite web server.
- `src/main.tsx` — React bootstrap.
- `src/test/setup.ts` — jest-dom and Testing Library cleanup.

### Source migration and content

- `scripts/import-source-map.mjs` — copy the original Markdown snapshot and generate stable inventory records.
- `scripts/check-content-coverage.mjs` — validate source-reference coverage and write the coverage report.
- `content/source/personal-frontend-skill-map.md` — imported source snapshot.
- `content/source/inventory.json` — generated headings and list items with stable source references.
- `content/roadmap/sources.json` — curated source registry.
- `content/roadmap/route-frontend-model.json` — JavaScript, React, TypeScript.
- `content/roadmap/route-data-flow.json` — HTTP, browser, TanStack Query, security, testing.
- `content/roadmap/route-production-frontend.json` — architecture, build, performance, HTML/CSS/accessibility, frontend observability.
- `content/roadmap/route-fullstack-delivery.json` — Node.js, SQL/PostgreSQL, Docker, proxy, CI/CD, backend observability.
- `content/roadmap/supporting-lanes.json` — pet project, Git, review, English, AI, algorithms, deferred catalog.
- `content/roadmap/meta.json` — source references consumed by priorities, ordering, mastery template, and career-impact rules.
- `docs/content-coverage.md` — generated human-readable coverage report.
- `src/content/loadRoadmap.ts` — import JSON, validate it, and expose typed content.
- `src/content/coverage.test.ts` — strict zero-orphan source coverage.

### Domain

- `src/domain/roadmap/types.ts` — roadmap, route, module, topic, source, and practice contracts.
- `src/domain/roadmap/validateRoadmap.ts` — runtime content validation.
- `src/domain/roadmap/buildRoadmapIndex.ts` — topic/module/route lookup maps.
- `src/domain/progress/types.ts` — progress schema and actions.
- `src/domain/progress/progressReducer.ts` — learning-cycle state transitions and WIP enforcement.
- `src/domain/progress/storage.ts` — small guarded `localStorage` access.
- `src/domain/progress/importExport.ts` — validated JSON backup/restore.
- `src/domain/recommendation/selectFocus.ts` — deterministic focus, queue, due-review, and reason selection.

### Application and features

- `src/app/App.tsx` — route dispatch and provider composition.
- `src/app/AppShell.tsx` — responsive page frame and primary navigation.
- `src/app/hashRoute.ts` — small dependency-free hash router.
- `src/app/ProgressProvider.tsx` — reducer, persistence, and storage status.
- `src/features/focus/FocusPage.tsx` — current step, next three, first review, module context.
- `src/features/roadmap/RoadmapPage.tsx` — route/module browsing and filters.
- `src/features/topic/TopicPage.tsx` — complete six-stage learning cycle.
- `src/features/progress/ProgressPage.tsx` — learned, paused, active, and review history.
- `src/features/settings/SettingsPage.tsx` — export, import, reset, and persistence status.
- `src/ui/` — focused reusable controls: `Button`, `ProgressSteps`, `StatusPill`, `EmptyState`, `ConfirmDialog`.
- `src/styles/tokens.css` — visual tokens.
- `src/styles/global.css` — reset, typography, layout, focus, and reduced-motion rules.
- `src/styles/components.css` — shared visual primitives.

### End-to-end tests

- `e2e/core-flow.spec.ts` — start, pause, resume, review, persistence, and basic keyboard navigation.
- `e2e/backup.spec.ts` — backup, reset, restore, and invalid import.

---

### Task 1: Create the React, TypeScript, and Test Foundation

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/test/setup.ts`
- Create: `src/app/App.test.tsx`

**Interfaces:**
- Produces: `App(): JSX.Element`, Vite build, `npm test`, and jsdom component-test environment.
- Consumes: none.

- [ ] **Step 1: Define dependency and script manifest**

Create `package.json`:

```json
{
  "name": "frontend-learning-roadmap",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:all": "npm run test && npm run build && npm run test:e2e",
    "content:import": "node scripts/import-source-map.mjs",
    "content:coverage": "node scripts/check-content-coverage.mjs --check"
  }
}
```

Install and lock dependencies:

```bash
rtk npm install react react-dom
rtk npm install -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom @playwright/test
```

Expected: `package-lock.json` exists and `npm ls --depth=0` exits `0`.

- [ ] **Step 2: Write the first failing application test**

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the product identity', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Frontend Path' }),
    ).toBeInTheDocument()
  })
})
```

Run:

```bash
rtk npm test -- src/app/App.test.tsx
```

Expected: FAIL because `App` and test configuration do not exist.

- [ ] **Step 3: Add strict TypeScript, Vite, Vitest, and bootstrap files**

Create `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())
```

Create `src/app/App.tsx`:

```tsx
export function App() {
  return <h1>Frontend Path</h1>
}
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Create `index.html` with `#root` and `/src/main.tsx`. Configure `tsconfig.app.json` with `strict`, `noUnusedLocals`, `noUnusedParameters`, `moduleResolution: "bundler"`, `resolveJsonModule`, `jsx: "react-jsx"`, and DOM libraries. Configure project references through `tsconfig.json`.

- [ ] **Step 4: Verify the foundation**

Run:

```bash
rtk npm test -- src/app/App.test.tsx
rtk npm run build
```

Expected: one passing test and a successful Vite production build.

- [ ] **Step 5: Commit**

```bash
rtk git add package.json package-lock.json index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts src
rtk git commit -m "chore: scaffold roadmap application"
```

---

### Task 2: Define and Validate the Roadmap Domain

**Files:**
- Create: `src/domain/roadmap/types.ts`
- Create: `src/domain/roadmap/validateRoadmap.ts`
- Create: `src/domain/roadmap/validateRoadmap.test.ts`
- Create: `src/domain/roadmap/buildRoadmapIndex.ts`
- Create: `src/domain/roadmap/buildRoadmapIndex.test.ts`

**Interfaces:**
- Produces:
  - `validateRoadmap(value: unknown): Roadmap`
  - `validateLane(value: unknown, sources: LearningSource[]): RoadmapLane`
  - `buildRoadmapIndex(roadmap: Roadmap): RoadmapIndex`
  - `findTopic(index: RoadmapIndex, topicId: string): Topic | undefined`
- Consumes: none.

- [ ] **Step 1: Write failing schema and index tests**

Use a complete fixture with one route, module, topic, source, practice task, dependency, and source reference. Assert:

```ts
expect(validateRoadmap(validFixture).routes[0].modules[0].topics[0].id)
  .toBe('event-loop')
expect(() => validateRoadmap({ routes: [] }))
  .toThrow('Roadmap.sources must contain at least one source')
expect(() => buildRoadmapIndex(duplicateTopicFixture))
  .toThrow('Duplicate topic id: event-loop')
```

Run:

```bash
rtk npm test -- src/domain/roadmap
```

Expected: FAIL because contracts and functions do not exist.

- [ ] **Step 2: Add exact content contracts**

Create `src/domain/roadmap/types.ts` with:

```ts
export type LaneKind =
  | 'primary-route'
  | 'pet-project'
  | 'background'
  | 'deferred'

export type SourceFormat =
  | 'documentation'
  | 'guide'
  | 'article'
  | 'course'
  | 'video'
  | 'exercise'

export type TopicPriority =
  | 'critical'
  | 'high'
  | 'supporting'
  | 'background'
  | 'deferred'

export interface LearningSource {
  id: string
  title: string
  url: string
  language: 'ru' | 'en'
  format: SourceFormat
  lastVerifiedAt: string
  section?: string
  englishReason?: string
}

export interface PracticeTask {
  id: string
  title: string
  instructions: string[]
  minimumCompletion: string
  estimatedMinutes: number
}

export interface Topic {
  id: string
  title: string
  outcome: string
  whyNow: string
  priority: TopicPriority
  recommendationWeight: number
  estimatedMinutes: [number, number]
  dependencies: string[]
  sourceIds: {
    primary: string
    fallback?: string
    practice?: string
  }
  obsidianPrompts: string[]
  ankiPrompts: string[]
  practice: PracticeTask[]
  masteryChecks: string[]
  quickSteps: string[]
  sourceRefs: string[]
}

export interface RoadmapModule {
  id: string
  title: string
  outcome: string
  topics: Topic[]
  sourceRefs: string[]
}

export interface RoadmapLane {
  id: string
  kind: LaneKind
  order: number
  title: string
  outcome: string
  modules: RoadmapModule[]
  sourceRefs: string[]
}

export interface Roadmap {
  contentVersion: number
  sources: LearningSource[]
  routes: RoadmapLane[]
  petProject: RoadmapLane
  background: RoadmapLane
  deferred: RoadmapLane
  metaSourceRefs: string[]
}

export interface TopicLocation {
  route: RoadmapLane
  module: RoadmapModule
  topic: Topic
}

export interface RoadmapIndex {
  topics: Map<string, TopicLocation>
  modules: Map<string, RoadmapModule>
  sources: Map<string, LearningSource>
}
```

- [ ] **Step 3: Implement runtime validation**

Implement small assertion helpers in `validateRoadmap.ts`: `assertRecord`, `assertString`, `assertStringArray`, `assertNonEmptyArray`, `assertTupleMinutes`, and `assertIsoDate`. `validateLane` validates one lane against a validated source list so content batches can be reviewed before the full roadmap exists. `validateRoadmap` calls the same lane validator for all seven lanes. Validate every field recursively and reject:

- empty route/source/topic IDs;
- non-HTTPS source URLs;
- missing primary sources;
- more than one fallback or practice source;
- empty `obsidianPrompts`, `ankiPrompts`, `practice`, `masteryChecks`, `quickSteps`, or `sourceRefs`;
- invalid minute ranges;
- recommendation weights outside `0..100`;
- duplicate IDs;
- dependencies and source IDs that do not exist.

Return the same value typed as `Roadmap` only after all checks pass:

```ts
export function validateRoadmap(value: unknown): Roadmap {
  assertRecord(value, 'Roadmap')
  assertNonEmptyArray(value.sources, 'Roadmap.sources')
  assertNonEmptyArray(value.routes, 'Roadmap.routes')
  return value as unknown as Roadmap
}
```

- [ ] **Step 4: Implement lookup indexes**

`buildRoadmapIndex` must include primary routes, pet project, background, and deferred lanes. It throws on duplicate route, module, topic, or source IDs and returns lookup maps.

- [ ] **Step 5: Verify and commit**

```bash
rtk npm test -- src/domain/roadmap
rtk npm run build
rtk git add src/domain/roadmap
rtk git commit -m "feat: define roadmap content domain"
```

Expected: schema and index suites pass; TypeScript build succeeds.

---

### Task 3: Import the Original Markdown and Enforce Traceability

**Files:**
- Create: `scripts/import-source-map.mjs`
- Create: `scripts/check-content-coverage.mjs`
- Create: `scripts/import-source-map.test.ts`
- Create: `content/source/personal-frontend-skill-map.md`
- Create: `content/source/inventory.json`
- Create: `docs/content-coverage.md`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - inventory record `{ id, line, kind, text, h1, h2 }`;
  - deterministic source IDs equal to `L` plus the four-digit source line number;
  - coverage report with counts for assigned, orphaned, duplicated, and unknown refs.
- Consumes: `sourceRefs` from every content entity defined in Task 2.

- [ ] **Step 1: Write failing inventory-parser tests**

Export `parseSourceMap(markdown)` and assert a fixture containing an H1, H2, unordered item, and numbered item produces:

```ts
expect(parseSourceMap(fixture).items).toEqual([
  { id: 'L0001', line: 1, kind: 'h1', text: '2. JavaScript', h1: '2. JavaScript', h2: null },
  { id: 'L0003', line: 3, kind: 'h2', text: '2.1. Выполнение', h1: '2. JavaScript', h2: '2.1. Выполнение' },
  { id: 'L0004', line: 4, kind: 'unordered', text: 'call stack', h1: '2. JavaScript', h2: '2.1. Выполнение' },
  { id: 'L0005', line: 5, kind: 'ordered', text: 'event loop', h1: '2. JavaScript', h2: '2.1. Выполнение' },
])
```

Run:

```bash
rtk npm test -- scripts/import-source-map.test.ts
```

Expected: FAIL because parser does not exist.

- [ ] **Step 2: Implement deterministic import**

`scripts/import-source-map.mjs` must:

1. accept the source path as the first CLI argument;
2. read UTF-8 text and preserve it as `content/source/personal-frontend-skill-map.md`;
3. create inventory records for `#`, `##`, `- `, and ordered-list lines;
4. compute a SHA-256 checksum;
5. write `content/source/inventory.json`;
6. print observed counts;
7. exit non-zero unless baseline counts equal `27`, `90`, `1175`, and `46`.

Keep parsing import-safe for Vitest. Run CLI work only behind:

```js
import { fileURLToPath } from 'node:url'

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await importSourceMap(process.argv[2])
}
```

The parser core:

```js
export function parseSourceMap(markdown) {
  let h1 = null
  let h2 = null
  const counts = { h1: 0, h2: 0, unordered: 0, ordered: 0 }
  const items = []

  markdown.split(/\r?\n/).forEach((lineText, index) => {
    const line = index + 1
    const id = `L${String(line).padStart(4, '0')}`
    const h1Match = lineText.match(/^# ([^#].*)$/)
    const h2Match = lineText.match(/^## ([^#].*)$/)
    const unorderedMatch = lineText.match(/^- (.+)$/)
    const orderedMatch = lineText.match(/^\d+\. (.+)$/)

    if (h1Match) {
      h1 = h1Match[1]
      h2 = null
      counts.h1 += 1
      items.push({ id, line, kind: 'h1', text: h1, h1, h2 })
    } else if (h2Match) {
      h2 = h2Match[1]
      counts.h2 += 1
      items.push({ id, line, kind: 'h2', text: h2, h1, h2 })
    } else if (unorderedMatch || orderedMatch) {
      const kind = unorderedMatch ? 'unordered' : 'ordered'
      counts[kind] += 1
      items.push({
        id,
        line,
        kind,
        text: (unorderedMatch ?? orderedMatch)[1],
        h1,
        h2,
      })
    }
  })

  return { counts, items }
}
```

- [ ] **Step 3: Import the real source**

```bash
rtk npm run content:import -- /Users/nikita/Documents/my_brain/personal-frontend-skill-map.md
```

Expected:

```text
h1=27 h2=90 unordered=1175 ordered=46
```

- [ ] **Step 4: Implement strict coverage reporting**

`check-content-coverage.mjs` reads inventory plus every JSON file under `content/roadmap`; a missing roadmap directory is treated as an empty content set so the guard can prove its initial failure. Recursively collect every `sourceRefs` value. Produce:

```md
# Content Coverage

- Source checksum: `<sha256>`
- Inventory items: 1338
- Assigned items: 1338
- Orphaned items: 0
- Unknown references: 0
- Duplicate assignments: `<count shown for review>`
```

The inventory total is `27 + 90 + 1175 + 46 = 1338`. Duplicate assignments are reported but allowed because one source item can support metadata and a learning topic. Orphaned and unknown references make `--check` exit `1`. The report file must be compared with generated output so stale reports also fail.

- [ ] **Step 5: Verify and commit**

Run parser tests. Before roadmap JSON exists, run coverage once and confirm the expected failure contains `Orphaned items: 1338`; this proves the guard is active.

```bash
rtk npm test -- scripts/import-source-map.test.ts
rtk npm run content:coverage
rtk git add scripts package.json content/source
rtk git commit -m "feat: inventory source roadmap content"
```

Expected: parser tests pass; coverage command fails only because curation has not been added yet.

---

### Task 4: Curate Route 1 — Frontend Mental Model

**Files:**
- Create: `content/roadmap/sources.json`
- Create: `content/roadmap/route-frontend-model.json`
- Create: `src/content/routeFrontendModel.test.ts`

**Interfaces:**
- Produces: lane `frontend-model` and verified source registry.
- Consumes: `RoadmapLane`, `validateLane`, inventory refs from sections 2, 3, and 4.

- [ ] **Step 1: Write failing content-quality tests**

Assert:

- lane kind is `primary-route`;
- order is `1`;
- modules include JavaScript, TypeScript, and React;
- every topic has six learning-cycle inputs;
- every source was verified on `2026-07-23`;
- primary resources are Russian unless their source record contains a non-empty `englishReason`;
- all dependencies resolve;
- every source reference belongs to source sections 2, 3, or 4.

Run:

```bash
rtk npm test -- src/content/routeFrontendModel.test.ts
```

Expected: FAIL because route content does not exist.

- [ ] **Step 2: Curate sources before topics**

Verify current URLs in a browser. Create stable source IDs for:

- JavaScript.info Russian chapters;
- MDN Russian references;
- React official documentation, using English where Russian material loses essential current behavior;
- TypeScript official Handbook;
- high-quality Russian supplemental explanations only when the official source is unsuitable as the first read.

Every source object must contain `id`, `title`, `url`, `language`, `format`, `lastVerifiedAt`, and an exact `section`. Primary, fallback, and practice roles belong to each topic’s `sourceIds`, not to the reusable source record.

- [ ] **Step 3: Convert source sections into coherent modules**

Use this exact allocation:

| Source section | Destination modules |
|---|---|
| 2.1–2.4 | execution model, values, functions, prototypes |
| 2.5–2.6 | async model, collections |
| 3.1–3.7 | TypeScript type system, narrowing, generics, advanced types, API boundaries, React typing, configuration |
| 4.1–4.5 | render/state/effects, composition, state ownership |
| 4.7–4.8 | resilience and forms |

Move 2.7, 2.8, 4.6 to Route 3 because their learning outcome is production build/performance. Keep their source references out of Route 1.

For each microtopic:

- cluster concepts that share one mental model;
- write a measurable outcome beginning with an action;
- assign `priority` and `recommendationWeight` from sections 1, 24, and 26;
- give a `[minimum, maximum]` minute estimate;
- add 2–4 Obsidian prompts;
- add 4–7 Anki prompt patterns;
- add at least one practice task with a concrete minimum;
- add 3–5 mastery checks;
- add at least one 10–15 minute quick step;
- assign every relevant inventory item through `sourceRefs`.

The `event-loop` topic is the quality baseline:

```json
{
  "id": "event-loop",
  "title": "Event loop: task и microtask",
  "outcome": "Предсказать порядок выполнения синхронного кода, Promise и setTimeout и объяснить причину без запуска.",
  "whyNow": "Это база Promise, race conditions и асинхронных React-эффектов.",
  "priority": "critical",
  "recommendationWeight": 100,
  "estimatedMinutes": [60, 90],
  "dependencies": ["call-stack", "promise-basics"],
  "sourceIds": {
    "primary": "javascript-info-event-loop",
    "fallback": "mdn-microtask-guide",
    "practice": "javascript-info-event-loop-tasks"
  },
  "obsidianPrompts": [
    "Опиши call stack, Web APIs, task queue и microtask queue.",
    "Объясни, почему microtask выполняется раньше следующей task.",
    "Добавь собственный пример Promise + setTimeout."
  ],
  "ankiPrompts": [
    "Предсказать порядок вывода.",
    "Объяснить причину порядка.",
    "Сравнить task и microtask.",
    "Назвать риск бесконечной цепочки microtask."
  ],
  "practice": [{
    "id": "event-loop-order",
    "title": "Предсказать порядок выполнения",
    "instructions": [
      "Решить четыре примера письменно.",
      "Запустить код только после фиксации ответа.",
      "Объяснить каждое расхождение."
    ],
    "minimumCompletion": "Три правильных ответа из четырёх и объяснение ошибки.",
    "estimatedMinutes": 20
  }],
  "masteryChecks": [
    "Объяснить модель без конспекта.",
    "Решить три из четырёх новых примеров.",
    "Найти неверное предположение в чужом объяснении."
  ],
  "quickSteps": [
    "Нарисовать очереди для одного примера за 10 минут."
  ],
  "sourceRefs": [
    "L0213",
    "L0219",
    "L0220",
    "L0221",
    "L0222",
    "L0223",
    "L0234",
    "L0235",
    "L0247",
    "L0248",
    "L0253",
    "L0257"
  ]
}
```

- [ ] **Step 4: Validate the route as an independent content unit**

`routeFrontendModel.test.ts` imports `sources.json` and `route-frontend-model.json`, validates source records, then calls `validateLane`. Keep full-roadmap composition out of production code until all lanes exist in Task 6.

- [ ] **Step 5: Verify and commit**

```bash
rtk npm test -- src/content/routeFrontendModel.test.ts src/domain/roadmap
rtk npm run build
rtk git add content/roadmap/sources.json content/roadmap/route-frontend-model.json src/content/routeFrontendModel.test.ts
rtk git commit -m "feat: curate frontend mental model route"
```

---

### Task 5: Curate Route 2 — Reliable Data Flow

**Files:**
- Create: `content/roadmap/route-data-flow.json`
- Modify: `content/roadmap/sources.json`
- Create: `src/content/routeDataFlow.test.ts`

**Interfaces:**
- Produces: lane `data-flow`.
- Consumes: source sections 5, 7, 8, 9, and 10.

- [ ] **Step 1: Write failing route tests**

Assert exact module order:

```ts
expect(route.modules.map(({ id }) => id)).toEqual([
  'http-network',
  'browser-platform',
  'server-state',
  'frontend-security',
  'testing-stack',
])
```

Also assert that testing topics follow `concepts → Vitest → RTL → MSW → Playwright`, security practice never instructs attacking real systems, and every source reference comes from the allocated sections.

- [ ] **Step 2: Curate and verify resources**

Use Russian MDN and Doka when accurate; use official English documentation for TanStack Query, Vitest, Testing Library, MSW, and Playwright when it is materially more current. Use PortSwigger Web Security Academy only for safe labs. Record exact sections and `lastVerifiedAt`.

- [ ] **Step 3: Convert sections using fixed boundaries**

| Source section | Module |
|---|---|
| 7 | HTTP and network |
| 8, excluding performance subsection | Browser platform |
| 5 | Server state with TanStack Query |
| 9 | Frontend security |
| 10 | Testing stack |

Create explicit dependency edges:

- TanStack Query basics depends on Promise/error basics and HTTP request lifecycle.
- Cache invalidation precedes optimistic updates.
- Authentication model precedes CSRF/cookie practice.
- Vitest concepts precede RTL; RTL precedes MSW; MSW precedes Playwright.

Every practice task must resemble frontend work: request cancellation, stale response protection, optimistic rollback, DOM behavior test, mocked API test, and user-flow E2E.

- [ ] **Step 4: Verify and commit**

```bash
rtk npm test -- src/content/routeDataFlow.test.ts src/content/routeFrontendModel.test.ts
rtk npm run build
rtk git add content/roadmap src/content
rtk git commit -m "feat: curate reliable data flow route"
```

---

### Task 6: Curate Production, Fullstack, Supporting, and Deferred Content

**Files:**
- Create: `content/roadmap/route-production-frontend.json`
- Create: `content/roadmap/route-fullstack-delivery.json`
- Create: `content/roadmap/supporting-lanes.json`
- Create: `content/roadmap/meta.json`
- Modify: `content/roadmap/sources.json`
- Create: `src/content/loadRoadmap.ts`
- Create: `src/content/loadRoadmap.test.ts`
- Create: `src/content/fullContent.test.ts`
- Create: `src/content/coverage.test.ts`
- Generate: `docs/content-coverage.md`

**Interfaces:**
- Produces: complete `Roadmap`, strict zero-orphan report.
- Consumes: every remaining source reference.

- [ ] **Step 1: Write failing full-content and coverage tests**

Assert:

- four primary route IDs in order;
- one pet-project, one background, and one deferred lane;
- every inventory ref is assigned;
- no unknown refs exist;
- every source ID resolves;
- every dependency resolves;
- the app contains no topic with an empty cycle field.

Expected strict coverage:

```ts
expect(report.inventoryItems).toBe(1338)
expect(report.orphaned).toEqual([])
expect(report.unknown).toEqual([])
```

- [ ] **Step 2: Curate Route 3 with fixed allocation**

| Source section | Destination |
|---|---|
| 6 | Frontend architecture |
| 2.7 | Modules and build |
| 2.8, 4.6, browser performance subsection | Performance and memory |
| 11 | HTML, CSS, accessibility |
| frontend parts of 17 | Frontend observability |

Practice must include architecture diagram, three ADRs, bundle inspection, long-task diagnosis, memory leak cleanup, accessible form/navigation, Lighthouse/DevTools interpretation, and frontend error tracing.

- [ ] **Step 3: Curate Route 4 with fixed allocation**

| Source section | Destination |
|---|---|
| 12 | Node.js and Fastify |
| 13 | SQL and PostgreSQL |
| 14 | Docker |
| 15 | Caddy and nginx |
| 16 | CI/CD |
| backend parts of 17 | Logging and observability |

Practice builds vertical pet-project slices. Keep Node and SQL foundations before deployment topics. Security-sensitive examples use local containers and synthetic data.

- [ ] **Step 4: Curate supporting lanes and metadata**

Allocation:

- section 23 becomes the pet-project lane;
- sections 18–22 become background modules;
- section 1 critical/high/supporting lists and sections 24/26 become recommendation metadata;
- section 25 becomes mastery-template metadata;
- section 1 “Пока не приоритетно” becomes deferred catalog entries that never enter automatic focus.

The app must expose deferred entries for reference while clearly labeling them «Не сейчас».

- [ ] **Step 5: Compose and validate the complete roadmap**

Create `src/content/loadRoadmap.ts`:

```ts
import dataFlow from '../../content/roadmap/route-data-flow.json'
import frontendModel from '../../content/roadmap/route-frontend-model.json'
import fullstackDelivery from '../../content/roadmap/route-fullstack-delivery.json'
import meta from '../../content/roadmap/meta.json'
import productionFrontend from '../../content/roadmap/route-production-frontend.json'
import sources from '../../content/roadmap/sources.json'
import supporting from '../../content/roadmap/supporting-lanes.json'
import { buildRoadmapIndex } from '../domain/roadmap/buildRoadmapIndex'
import { validateRoadmap } from '../domain/roadmap/validateRoadmap'

export const roadmap = validateRoadmap({
  contentVersion: 1,
  sources,
  routes: [
    frontendModel,
    dataFlow,
    productionFrontend,
    fullstackDelivery,
  ],
  petProject: supporting.petProject,
  background: supporting.background,
  deferred: supporting.deferred,
  metaSourceRefs: meta.sourceRefs,
})

export const roadmapIndex = buildRoadmapIndex(roadmap)
```

`loadRoadmap.test.ts` imports these exports and asserts four route IDs in order plus all supporting lane kinds.

- [ ] **Step 6: Run strict coverage and inspect duplicates**

```bash
rtk npm test -- src/content
rtk npm run content:coverage
```

Expected:

```text
Inventory items: 1338
Orphaned items: 0
Unknown references: 0
```

Open `docs/content-coverage.md`. Review every duplicate assignment and keep it only when the same source item intentionally powers both metadata and a topic.

- [ ] **Step 7: Verify and commit**

```bash
rtk npm test
rtk npm run build
rtk git add content/roadmap src/content docs/content-coverage.md
rtk git commit -m "feat: complete roadmap content migration"
```

---

### Task 7: Implement Progress, Learning-Cycle Transitions, and Persistence

**Files:**
- Create: `src/domain/progress/types.ts`
- Create: `src/domain/progress/progressReducer.ts`
- Create: `src/domain/progress/progressReducer.test.ts`
- Create: `src/domain/progress/storage.ts`
- Create: `src/domain/progress/storage.test.ts`

**Interfaces:**
- Produces:
  - `createInitialProgress(): ProgressState`
  - `progressReducer(state, action): ProgressState`
  - `loadProgress(storage: Pick<Storage, 'getItem'>): LoadProgressResult`
  - `saveProgress(storage: Pick<Storage, 'setItem'>, state: ProgressState): SaveProgressResult`
  - `PROGRESS_STORAGE_KEY = 'frontend-path/progress'`
- Consumes: topic IDs and `StudyStepId`.

- [ ] **Step 1: Define state and failing reducer tests**

Use:

```ts
export type StudyStepId =
  | 'source'
  | 'obsidian'
  | 'anki'
  | 'practice'
  | 'selfCheck'
  | 'firstReview'

export type TopicStatus =
  | 'not_started'
  | 'active'
  | 'paused'
  | 'awaiting_review'
  | 'mastered'

export interface TopicProgress {
  status: TopicStatus
  completedSteps: Partial<Record<StudyStepId, string>>
  obsidianUrl?: string
  reviewDueAt?: string
  startedAt?: string
  masteredAt?: string
}

export interface ProgressState {
  schemaVersion: 1
  activeTopicId: string | null
  queue: string[]
  topics: Record<string, TopicProgress>
  history: Array<{
    topicId: string
    type: 'started' | 'paused' | 'step-completed' | 'mastered'
    at: string
  }>
}

export interface LoadProgressResult {
  state: ProgressState
  warning?: 'unavailable' | 'invalid'
}

export type SaveProgressResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'quota' }
```

Failing tests must prove:

- activating B pauses active A;
- completing `selfCheck` sets `awaiting_review` and `reviewDueAt` exactly three days later;
- completing `firstReview` sets `mastered` and clears active focus;
- queue is deduplicated and excludes mastered topics;
- viewing never creates progress;
- invalid step order throws a domain error.

- [ ] **Step 2: Implement reducer and storage adapters**

Actions use explicit timestamps:

```ts
type ProgressAction =
  | { type: 'topic/activate'; topicId: string; at: string }
  | { type: 'topic/complete-step'; topicId: string; step: StudyStepId; at: string }
  | { type: 'topic/set-obsidian-url'; topicId: string; url: string }
  | { type: 'queue/add'; topicId: string }
  | { type: 'queue/remove'; topicId: string }
  | { type: 'state/replace'; state: ProgressState }
  | { type: 'state/reset' }
```

`storage.ts` returns the tagged `LoadProgressResult` and `SaveProgressResult` contracts instead of throwing.

- [ ] **Step 3: Keep invalid local data recoverable but simple**

If stored JSON is missing or invalid, return `createInitialProgress()` with warning `invalid`; never crash the roadmap. If storage is unavailable, return the initial state with warning `unavailable`. Do not implement a migration registry or future-version framework.

- [ ] **Step 4: Verify and commit**

```bash
rtk npm test -- src/domain/progress
rtk npm run build
rtk git add src/domain/progress
rtk git commit -m "feat: persist learning progress"
```

---

### Task 8: Implement Import, Export, and the Deterministic Recommendation Engine

**Files:**
- Create: `src/domain/progress/importExport.ts`
- Create: `src/domain/progress/importExport.test.ts`
- Create: `src/domain/recommendation/selectFocus.ts`
- Create: `src/domain/recommendation/selectFocus.test.ts`

**Interfaces:**
- Produces:
  - `exportProgress(state, now): string`
  - `parseProgressImport(raw, index): ImportResult`
  - `selectFocus(roadmap, index, progress, now): FocusSelection`
- Consumes: `ProgressState`, `Roadmap`, `RoadmapIndex`.

- [ ] **Step 1: Write failing import/export tests**

The envelope:

```ts
interface ProgressExport {
  format: 'frontend-path-progress'
  exportedAt: string
  progress: ProgressState
}

type ImportResult =
  | {
      ok: true
      state: ProgressState
      unknownTopicIds: string[]
    }
  | {
      ok: false
      reason: 'invalid-json' | 'invalid-format' | 'invalid-progress'
    }
```

Tests prove:

- round-trip equality;
- malformed JSON is rejected;
- wrong format is rejected;
- unknown topic IDs are returned as a visible warning;
- current state remains untouched until a valid parsed result is dispatched.

- [ ] **Step 2: Write failing recommendation tests**

Use a four-topic fixture and assert priority:

1. existing active topic;
2. first non-mastered manual queue topic;
3. available topic with highest `recommendationWeight`, then route/module/topic order;
4. first remaining topic with `missingDependencies`;
5. due reviews appear separately and do not replace focus.

The result:

```ts
export interface FocusSelection {
  topicId: string | null
  reason: 'active' | 'queue' | 'recommended' | 'missing-prerequisites' | 'complete'
  nextTopicIds: string[]
  dueReviewTopicIds: string[]
  missingDependencies: string[]
}
```

- [ ] **Step 3: Implement pure functions**

No function reads the clock, browser, or storage directly. Pass ISO `now` into export and recommendation functions. Limit `nextTopicIds` to three for the Focus screen.

- [ ] **Step 4: Verify and commit**

```bash
rtk npm test -- src/domain/progress/importExport.test.ts src/domain/recommendation
rtk npm run build
rtk git add src/domain/progress/importExport.ts src/domain/progress/importExport.test.ts src/domain/recommendation
rtk git commit -m "feat: recommend focus and protect progress backups"
```

---

### Task 9: Build the Quiet Study App Shell and Hash Navigation

**Files:**
- Create: `src/app/hashRoute.ts`
- Create: `src/app/hashRoute.test.ts`
- Create: `src/app/AppShell.tsx`
- Create: `src/app/ProgressProvider.tsx`
- Modify: `src/app/App.tsx`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/styles/components.css`
- Modify: `src/main.tsx`
- Create: `src/ui/Button.tsx`
- Create: `src/ui/StatusPill.tsx`
- Create: `src/ui/EmptyState.tsx`

**Interfaces:**
- Produces:
  - `HashRoute = { page: 'focus' | 'roadmap' | 'progress' | 'settings' } | { page: 'topic'; topicId: string }`
  - `parseHash(hash): HashRoute`
  - `ProgressProvider` and `useProgress()`
  - responsive `AppShell`.
- Consumes: roadmap, progress reducer, storage.

- [ ] **Step 1: Write failing navigation and shell tests**

Assert:

```ts
expect(parseHash('#/topic/event-loop')).toEqual({
  page: 'topic',
  topicId: 'event-loop',
})
expect(parseHash('#/unknown')).toEqual({ page: 'focus' })
```

Render shell and assert banner, navigation landmark, main landmark, `aria-current`, and storage-warning live region.

- [ ] **Step 2: Implement dependency-free hash routing**

`useHashRoute` uses `useSyncExternalStore` to subscribe to `hashchange`. Navigation remains native anchors such as `href="#/focus"` so keyboard behavior and link semantics work without a routing dependency.

- [ ] **Step 3: Implement ProgressProvider**

Load once through `loadProgress`, persist after reducer changes, expose:

```ts
interface ProgressContextValue {
  state: ProgressState
  dispatch: Dispatch<ProgressAction>
  storageWarning?: 'unavailable' | 'invalid'
}
```

Show a short warning when initial loading fails. Continue with an empty state so the personal roadmap remains usable.

- [ ] **Step 4: Implement visual tokens**

Use:

```css
:root {
  --paper: #f3efe5;
  --paper-raised: #fffdf7;
  --ink: #243126;
  --ink-muted: #59645a;
  --line: #d9d0be;
  --accent: #b74f32;
  --accent-hover: #963f28;
  --focus: #215b49;
  --warning-bg: #fff4d6;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --content: 72rem;
}
```

Use Georgia as the resilient editorial heading fallback and a system sans-serif stack for controls. Define visible `:focus-visible`, minimum 44px controls, mobile breakpoint, and reduced-motion override.

- [ ] **Step 5: Verify and commit**

```bash
rtk npm test -- src/app src/ui
rtk npm run build
rtk git add src/app src/ui src/styles src/main.tsx
rtk git commit -m "feat: add quiet study application shell"
```

---

### Task 10: Implement the Focus Screen and Six-Stage Topic Workflow

**Files:**
- Create: `src/features/focus/FocusPage.tsx`
- Create: `src/features/focus/FocusPage.test.tsx`
- Create: `src/features/topic/TopicPage.tsx`
- Create: `src/features/topic/TopicPage.test.tsx`
- Create: `src/ui/ProgressSteps.tsx`
- Create: `src/ui/ConfirmDialog.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Produces: working `#/focus` and `#/topic/:topicId` experiences.
- Consumes: roadmap index, `selectFocus`, `useProgress`, progress actions.

- [ ] **Step 1: Write failing Focus tests**

Assert the screen:

- explains why the topic is shown;
- displays current step and estimated minutes;
- shows exactly three next topics;
- shows due review separately;
- offers a quick step from the same active topic;
- displays a no-focus state without starting a topic automatically.

- [ ] **Step 2: Write failing Topic tests**

Use `userEvent` to prove:

- “Сделать текущим фокусом” activates the topic;
- activating another topic opens a confirmation explaining the existing topic will pause;
- source link uses `target="_blank"` and safe `rel`;
- Obsidian URL is optional and editable;
- steps unlock in order;
- self-check schedules review;
- first review marks mastery;
- missing dependencies show warning but action remains available.

- [ ] **Step 3: Implement FocusPage**

The page hierarchy:

1. route/module eyebrow;
2. topic outcome;
3. current action card;
4. primary action;
5. next three list;
6. due-review panel;
7. module-context summary.

Do not render streaks, deadlines, overdue labels, or global percent.

- [ ] **Step 4: Implement TopicPage**

Render all six stages from one typed stage definition. Each stage dispatches one domain action. Practice completion is a user confirmation after displaying instructions and minimum. Self-check requires individually checking every mastery item before completion.

- [ ] **Step 5: Verify and commit**

```bash
rtk npm test -- src/features/focus src/features/topic src/domain
rtk npm run build
rtk git add src/features/focus src/features/topic src/ui src/app/App.tsx
rtk git commit -m "feat: guide complete topic learning cycles"
```

---

### Task 11: Implement Roadmap Browsing, Filters, Queue, and Free Switching

**Files:**
- Create: `src/features/roadmap/RoadmapPage.tsx`
- Create: `src/features/roadmap/RoadmapPage.test.tsx`
- Create: `src/features/roadmap/filterRoadmap.ts`
- Create: `src/features/roadmap/filterRoadmap.test.ts`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Produces: `#/roadmap`, status/route/duration filters, manual queue management.
- Consumes: complete roadmap, index, progress state/actions.

- [ ] **Step 1: Write failing filter tests**

Test:

- status filters for new, active, paused, awaiting review, mastered;
- route filter;
- duration buckets `10–30`, `31–60`, `61+`;
- text search across topic and module titles;
- deferred topics excluded by default and visible under «Не сейчас».

- [ ] **Step 2: Write failing interaction tests**

Assert:

- all four routes are always openable;
- route completion is never required to open another route;
- queue addition is deduplicated;
- first three queued topics are visually emphasized;
- selecting a topic only navigates; it does not change status;
- “Сделать фокусом” performs the explicit state change.

- [ ] **Step 3: Implement route/module presentation**

Use expandable module sections and concise topic rows. Show status, estimate, dependency hint, and queue action. Keep full concept lists inside topic pages to avoid returning to the original wall of text.

- [ ] **Step 4: Verify and commit**

```bash
rtk npm test -- src/features/roadmap
rtk npm run build
rtk git add src/features/roadmap src/app/App.tsx
rtk git commit -m "feat: browse and switch roadmap routes freely"
```

---

### Task 12: Implement Progress, Export, Import, and Reset Screens

**Files:**
- Create: `src/features/progress/ProgressPage.tsx`
- Create: `src/features/progress/ProgressPage.test.tsx`
- Create: `src/features/settings/SettingsPage.tsx`
- Create: `src/features/settings/SettingsPage.test.tsx`
- Create: `src/features/settings/downloadProgress.ts`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Produces: `#/progress` and `#/settings`.
- Consumes: progress state, import/export functions, roadmap index, reducer actions.

- [ ] **Step 1: Write failing Progress tests**

Assert separate sections for active, paused, awaiting review, mastered, and history. Empty sections use calm explanatory copy. Module summaries show counts such as `3 освоено · 1 в работе · 4 впереди`, never a knowledge percentage.

- [ ] **Step 2: Write failing Settings tests**

Assert:

- export downloads `frontend-path-progress-YYYY-MM-DD.json`;
- invalid JSON shows a message and never dispatches `state/replace`;
- unknown topic IDs are listed before confirmation;
- valid import requires confirmation;
- reset dialog names local progress, queue, Obsidian links, and history;
- reset never deletes built-in roadmap content;
- unavailable storage shows one short warning and keeps roadmap readable.

- [ ] **Step 3: Implement download and import flow**

Create downloads with `Blob`, `URL.createObjectURL`, an ephemeral anchor, and `URL.revokeObjectURL`. Read import through `File.text()`, parse without mutation, render warnings, then dispatch only after confirmation.

- [ ] **Step 4: Implement Progress and Settings pages**

Keep all irreversible-looking actions visually secondary. Reset requires explicit confirmation. Import offers export-before-replace.

- [ ] **Step 5: Verify and commit**

```bash
rtk npm test -- src/features/progress src/features/settings src/domain/progress
rtk npm run build
rtk git add src/features/progress src/features/settings src/app/App.tsx
rtk git commit -m "feat: add progress backup and reset"
```

---

### Task 13: Add Playwright Coverage, Responsive Polish, and Final Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/core-flow.spec.ts`
- Create: `e2e/backup.spec.ts`
- Modify: `src/styles/global.css`
- Modify: `src/styles/components.css`
- Create: `README.md`

**Interfaces:**
- Produces: verified MVP and operator documentation.
- Consumes: complete application.

- [ ] **Step 1: Configure Playwright**

Create:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
```

- [ ] **Step 2: Write E2E learning-cycle scenarios**

`core-flow.spec.ts` must:

1. start `event-loop`;
2. complete source and Obsidian steps;
3. reload and verify the next step persists;
4. switch to another route and confirm `event-loop` becomes paused;
5. resume it;
6. complete self-check;
7. update `frontend-path/progress` through `page.evaluate` with a clock-independent due date;
8. complete first review and verify mastered state.

- [ ] **Step 3: Write backup and corruption scenarios**

Use Playwright download assertions for export. Save exported text, reset, import it, confirm recovery. Then upload malformed JSON and assert current mastered state remains.

- [ ] **Step 4: Write keyboard and responsive scenarios**

In the same core-flow test, use the desktop viewport and one explicit `page.setViewportSize({ width: 390, height: 844 })` check:

- Tab through navigation and the primary action;
- assert one `main`, one navigation label, and logical headings;
- verify no horizontal page overflow.

- [ ] **Step 5: Add README**

Document:

- Node requirement;
- install, dev, test, build, and E2E commands;
- local-only data behavior;
- backup/restore;
- content import command;
- coverage command and zero-orphan guarantee;
- content-update workflow and source-verification date.

- [ ] **Step 6: Run full verification**

Install the browser once:

```bash
rtk npx playwright install chromium
```

Then:

```bash
rtk npm test
rtk npm run content:coverage
rtk npm run build
rtk npm run test:e2e
rtk git diff --check
rtk git status --short
```

Expected:

- all Vitest suites pass;
- content report shows `1338` inventory items, `0` orphaned, `0` unknown;
- Vite production build succeeds;
- the single Chromium project passes;
- no whitespace errors;
- only intended task files remain uncommitted before the final commit.

- [ ] **Step 7: Commit**

```bash
rtk git add playwright.config.ts e2e src/styles README.md docs/content-coverage.md
rtk git commit -m "test: verify roadmap learning workflows"
```

## Final Acceptance Checklist

- [ ] Original Markdown checksum and inventory are committed.
- [ ] Coverage report contains all 1338 tracked source items with zero orphaned and zero unknown references.
- [ ] All 22 learning directions are represented in primary, supporting, pet-project, or deferred content.
- [ ] Main screen shows one focus, three next topics, and due review separately.
- [ ] User can browse and activate any route without completing previous routes.
- [ ] Activating a topic pauses the previous active topic and preserves its progress.
- [ ] Topic workflow supports source, Obsidian, Anki, practice, self-check, and first review.
- [ ] First review is scheduled three days after self-check; later repetition stays in Anki.
- [ ] Progress survives reload and valid import/export.
- [ ] Invalid import and unavailable storage do not destroy current data or block roadmap reading.
- [ ] UI matches “Тихий кабинет”, remains calm on missed days, and works on desktop/mobile with keyboard.
- [ ] Unit, component, build, content-coverage, and E2E checks pass.
