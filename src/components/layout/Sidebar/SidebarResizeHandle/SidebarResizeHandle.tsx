'use client'

import { memo, useCallback, useEffect, useRef } from 'react'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import styles from './SidebarResizeHandle.module.css'

interface Props {
  readonly currentWidth: number
  readonly minWidth: number
  readonly maxWidth: number
  readonly closeThreshold: number
  readonly onWidthChange: (next: number) => void
  readonly onCollapsingChange: (collapsing: boolean) => void
  readonly onClose: () => void
}

interface DragState {
  readonly startX: number
  readonly startWidth: number
  latestWidth: number
}

interface ResizeBounds {
  readonly minWidth: number
  readonly maxWidth: number
  readonly closeThreshold: number
}

interface ResizeStep {
  readonly width: number
  readonly collapsing: boolean
}

function computeResizeStep(
  drag: DragState,
  clientX: number,
  bounds: ResizeBounds,
): ResizeStep {
  const raw = drag.startWidth + (clientX - drag.startX)
  drag.latestWidth = raw
  if (raw < bounds.closeThreshold) {
    return { width: bounds.minWidth, collapsing: true }
  }
  return {
    width: Math.min(bounds.maxWidth, Math.max(bounds.minWidth, raw)),
    collapsing: false,
  }
}

function lockGlobalCursor(): void {
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function unlockGlobalCursor(): void {
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

const SidebarResizeHandle = memo(function SidebarResizeHandle({
  currentWidth,
  minWidth,
  maxWidth,
  closeThreshold,
  onWidthChange,
  onCollapsingChange,
  onClose,
}: Props): JSX.Element {
  const dragStateRef = useRef<DragState | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(
    () => () => {
      cleanupRef.current?.()
    },
    [],
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const drag: DragState = {
        startX: event.clientX,
        startWidth: currentWidth,
        latestWidth: currentWidth,
      }
      dragStateRef.current = drag
      lockGlobalCursor()

      const bounds: ResizeBounds = { minWidth, maxWidth, closeThreshold }

      const handleMove = (e: PointerEvent): void => {
        const active = dragStateRef.current
        if (active === null) return
        const step = computeResizeStep(active, e.clientX, bounds)
        onWidthChange(step.width)
        onCollapsingChange(step.collapsing)
      }

      const handleUp = (): void => {
        const active = dragStateRef.current
        const shouldClose = active !== null && active.latestWidth < closeThreshold
        dragStateRef.current = null
        onCollapsingChange(false)
        unlockGlobalCursor()
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
        window.removeEventListener('pointercancel', handleUp)
        cleanupRef.current = null
        if (shouldClose) {
          onClose()
        }
      }

      cleanupRef.current = handleUp
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      window.addEventListener('pointercancel', handleUp)
    },
    [
      currentWidth,
      minWidth,
      maxWidth,
      closeThreshold,
      onWidthChange,
      onCollapsingChange,
      onClose,
    ],
  )

  return (
    <>
      <div
        className={styles.dragHandle}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        onPointerDown={handlePointerDown}
      />
      <button
        type="button"
        className={styles.hideButton}
        onClick={onClose}
        aria-label="Hide sidebar"
      >
        <ChevronLeftIcon fontSize="small" />
      </button>
    </>
  )
})

export default SidebarResizeHandle
