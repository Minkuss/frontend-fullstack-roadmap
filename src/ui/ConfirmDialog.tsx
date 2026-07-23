import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type RefObject,
  type ReactNode,
} from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  cancelLabel?: string
  children: ReactNode
  confirmLabel: string
  confirmVariant?: 'primary' | 'secondary'
  fallbackFocusRef?: RefObject<HTMLElement | null>
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  title: string
}

export function ConfirmDialog({
  cancelLabel = 'Отмена',
  children,
  confirmLabel,
  confirmVariant = 'primary',
  fallbackFocusRef,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const previouslyFocused = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()

    return () => {
      const focusTarget = previouslyFocused?.isConnected
        ? previouslyFocused
        : fallbackFocusRef?.current
      focusTarget?.focus()
    }
  }, [fallbackFocusRef, open])

  if (!open) {
    return null
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const first = cancelRef.current
    const last = confirmRef.current
    if (!first || !last) {
      return
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="dialog-backdrop">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <h2 id={titleId}>{title}</h2>
        <div className="confirm-dialog__copy">{children}</div>
        <div className="confirm-dialog__actions">
          <Button onClick={onCancel} ref={cancelRef} variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            ref={confirmRef}
            variant={confirmVariant}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
