'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Dismiss a popover on outside-click or Escape. Listens only while `isOpen`.
 */
export function useDismissPopover(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss()
      }
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onDismiss()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [ref, isOpen, onDismiss])
}
