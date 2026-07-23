import { useId, type ReactNode } from 'react'

interface EmptyStateProps {
  action?: ReactNode
  children: ReactNode
  title: string
}

export function EmptyState({
  action,
  children,
  title,
}: EmptyStateProps) {
  const titleId = useId()

  return (
    <section className="empty-state" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <div className="empty-state__copy">{children}</div>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </section>
  )
}
