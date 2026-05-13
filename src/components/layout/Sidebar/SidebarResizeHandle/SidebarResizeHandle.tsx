'use client'

import { memo, useCallback, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import {
  computeResizeStep,
  lockGlobalCursor,
  unlockGlobalCursor,
  type DragState,
  type ResizeBounds,
} from './helpers'
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

export default memo(function SidebarResizeHandle({
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
      <Box
        className={styles.dragHandle}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        onPointerDown={handlePointerDown}
      />
      <Box
        component="button"
        type="button"
        className={styles.hideButton}
        onClick={onClose}
        aria-label="Hide sidebar"
      >
        <ChevronLeftIcon fontSize="small" />
      </Box>
    </>
  )
})
