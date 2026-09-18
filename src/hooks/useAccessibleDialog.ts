import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const dialogStack: symbol[] = []
let openDialogCount = 0
let previousBodyOverflow = ''

export default function useAccessibleDialog<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
): RefObject<T | null> {
  const dialogRef = useRef<T | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const dialogId = Symbol('dialog')
    const previouslyFocused = document.activeElement as HTMLElement | null

    dialogStack.push(dialogId)
    openDialogCount += 1

    if (openDialogCount === 1) {
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }

    const focusTimer = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current
      if (!dialog) return

      const firstFocusable = dialog.querySelector<HTMLElement>(
        FOCUSABLE_SELECTOR,
      )

      ;(firstFocusable ?? dialog).focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== dialogId) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          element.getAttribute('aria-hidden') !== 'true' &&
          element.getClientRects().length > 0,
      )

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)

      const stackIndex = dialogStack.lastIndexOf(dialogId)
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1)

      openDialogCount = Math.max(0, openDialogCount - 1)
      if (openDialogCount === 0) {
        document.body.style.overflow = previousBodyOverflow
      }

      if (previouslyFocused?.isConnected) {
        window.requestAnimationFrame(() => previouslyFocused.focus())
      }
    }
  }, [open])

  return dialogRef
}
