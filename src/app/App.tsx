import { EmptyState } from '../ui/EmptyState'
import { FocusPage } from '../features/focus/FocusPage'
import { TopicPage } from '../features/topic/TopicPage'
import { AppShell } from './AppShell'
import { useHashRoute, type HashRoute } from './hashRoute'
import { useProgress } from './ProgressProvider'

const PAGE_COPY = {
  focus: {
    eyebrow: 'Сегодня',
    title: 'Фокус',
    lead: 'Одна тема, один ближайший шаг и никакого календарного долга.',
    emptyTitle: 'Текущей темы пока нет',
    emptyCopy:
      'Можно спокойно открыть roadmap и выбрать направление, к которому сейчас есть интерес.',
  },
  roadmap: {
    eyebrow: 'Вся карта',
    title: 'Roadmap',
    lead: 'Четыре маршрута доступны одновременно — переходить между ними можно свободно.',
    emptyTitle: 'Маршруты скоро появятся здесь',
    emptyCopy:
      'Содержание уже подготовлено. Следующий шаг — добавить удобный обзор модулей и тем.',
  },
  progress: {
    eyebrow: 'Без процентов знания',
    title: 'Прогресс',
    lead: 'Здесь будут завершённые учебные циклы, паузы и первые повторения.',
    emptyTitle: 'История начнётся с первой темы',
    emptyCopy:
      'Пропущенные дни не считаются долгом: учитываются только сделанные шаги.',
  },
  settings: {
    eyebrow: 'Локальные данные',
    title: 'Настройки',
    lead: 'Прогресс хранится в браузере; здесь появятся резервная копия и восстановление.',
    emptyTitle: 'Пока настраивать нечего',
    emptyCopy:
      'Roadmap уже работает локально. Экспорт, импорт и сброс будут добавлены следующим этапом.',
  },
} as const

function PlaceholderPage({ route }: { route: HashRoute }) {
  if (route.page === 'topic') return null
  const copy = PAGE_COPY[route.page]

  return (
    <section className="placeholder-page">
      <header className="placeholder-page__intro">
        <p className="placeholder-page__eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="placeholder-page__lead">{copy.lead}</p>
      </header>
      <EmptyState
        title={copy.emptyTitle}
        action={
          route.page === 'focus' ? (
            <a href="#/roadmap">Открыть roadmap</a>
          ) : undefined
        }
      >
        {copy.emptyCopy}
      </EmptyState>
    </section>
  )
}

interface AppProps {
  now?: string
}

export function App({ now = new Date().toISOString() }: AppProps) {
  const route = useHashRoute()
  const { storageWarning } = useProgress()

  return (
    <AppShell route={route} storageWarning={storageWarning}>
      {route.page === 'focus' ? <FocusPage now={now} /> : null}
      {route.page === 'topic' ? (
        <TopicPage now={now} topicId={route.topicId} />
      ) : null}
      {route.page !== 'focus' && route.page !== 'topic' ? (
        <PlaceholderPage route={route} />
      ) : null}
    </AppShell>
  )
}
