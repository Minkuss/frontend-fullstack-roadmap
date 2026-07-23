import type { MouseEvent, ReactNode } from 'react'
import type { HashRoute } from './hashRoute'

interface AppShellProps {
  children: ReactNode
  route: HashRoute
  storageWarning?: 'unavailable' | 'invalid'
}

const NAVIGATION_ITEMS = [
  { page: 'focus', href: '#/focus', label: 'Фокус' },
  { page: 'roadmap', href: '#/roadmap', label: 'Roadmap' },
  { page: 'progress', href: '#/progress', label: 'Прогресс' },
  { page: 'settings', href: '#/settings', label: 'Настройки' },
] as const

function isCurrentPage(
  item: (typeof NAVIGATION_ITEMS)[number],
  route: HashRoute,
) {
  if (route.page === 'topic') {
    return item.page === 'roadmap'
  }

  return item.page === route.page
}

function StorageWarning({
  warning,
}: {
  warning: NonNullable<AppShellProps['storageWarning']>
}) {
  const message =
    warning === 'invalid'
      ? 'Не удалось прочитать сохранённый прогресс. Начинаю с пустого состояния.'
      : 'Прогресс пока не сохраняется в этом браузере. Roadmap остаётся доступным.'

  return (
    <div className="storage-warning" role="status" aria-live="polite">
      {message}
    </div>
  )
}

export function AppShell({
  children,
  route,
  storageWarning,
}: AppShellProps) {
  function focusMain(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    event.currentTarget.ownerDocument.getElementById('main-content')?.focus()
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={focusMain}>
        К содержанию
      </a>

      <header className="app-shell__banner">
        <div className="app-shell__header">
          <a
            className="product-mark"
            href="#/focus"
            aria-label="Frontend Path — личный маршрут обучения"
          >
            <span className="product-mark__name">Frontend Path</span>
            <span className="product-mark__note">личный маршрут обучения</span>
          </a>

          <nav aria-label="Основная навигация">
            <ul className="app-navigation">
              {NAVIGATION_ITEMS.map((item) => (
                <li key={item.page}>
                  <a
                    className="app-navigation__link"
                    href={item.href}
                    aria-current={
                      isCurrentPage(item, route) ? 'page' : undefined
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {storageWarning ? (
          <div className="app-shell__notice">
            <StorageWarning warning={storageWarning} />
          </div>
        ) : null}
      </header>

      <main className="app-shell__main" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
