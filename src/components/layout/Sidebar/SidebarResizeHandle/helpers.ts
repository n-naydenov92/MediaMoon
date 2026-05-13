export interface DragState {
  readonly startX: number
  readonly startWidth: number
  latestWidth: number
}

export interface ResizeBounds {
  readonly minWidth: number
  readonly maxWidth: number
  readonly closeThreshold: number
}

export interface ResizeStep {
  readonly width: number
  readonly collapsing: boolean
}

export function computeResizeStep(
  drag: DragState,
  clientX: number,
  bounds: ResizeBounds,
): ResizeStep {
  const raw = drag.startWidth + (clientX - drag.startX)
  // eslint-disable-next-line no-param-reassign -- drag is a ref-held mutable state container
  drag.latestWidth = raw
  if (raw < bounds.closeThreshold) {
    return { width: bounds.minWidth, collapsing: true }
  }
  return {
    width: Math.min(bounds.maxWidth, Math.max(bounds.minWidth, raw)),
    collapsing: false,
  }
}

export function lockGlobalCursor(): void {
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

export function unlockGlobalCursor(): void {
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}
