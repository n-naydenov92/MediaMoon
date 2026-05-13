'use client'

import { useCallback, useEffect, useState } from 'react'

const DEFAULT_WIDTH_PX = 260
const MIN_WIDTH_PX = 220
const MAX_WIDTH_PX = 400
const CLOSE_THRESHOLD_PX = 180
const STORAGE_KEY = 'mm.sidebar.width'

export interface SidebarResizeApi {
  readonly width: number
  readonly isCollapsing: boolean
  readonly minWidth: number
  readonly maxWidth: number
  readonly closeThreshold: number
  readonly setWidth: (next: number) => void
  readonly setCollapsing: (next: boolean) => void
}

export function useSidebarResize(): SidebarResizeApi {
  const [width, setWidthState] = useState<number>(DEFAULT_WIDTH_PX)
  const [isCollapsing, setIsCollapsing] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === null) {
      return
    }
    const parsed = Number.parseInt(stored, 10)
    if (Number.isFinite(parsed) && parsed >= MIN_WIDTH_PX && parsed <= MAX_WIDTH_PX) {
      setWidthState(parsed)
    }
  }, [])

  const setWidth = useCallback((next: number) => {
    setWidthState(next)
    window.localStorage.setItem(STORAGE_KEY, String(next))
  }, [])

  return {
    width,
    isCollapsing,
    minWidth: MIN_WIDTH_PX,
    maxWidth: MAX_WIDTH_PX,
    closeThreshold: CLOSE_THRESHOLD_PX,
    setWidth,
    setCollapsing: setIsCollapsing,
  }
}
