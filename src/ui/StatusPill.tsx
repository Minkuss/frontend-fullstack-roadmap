import type { HTMLAttributes } from 'react'

interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'active' | 'paused' | 'review' | 'mastered'
}

export function StatusPill({
  children,
  className = '',
  tone = 'neutral',
  ...props
}: StatusPillProps) {
  const classes = ['status-pill', `status-pill--${tone}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span {...props} className={classes}>
      {children}
    </span>
  )
}
