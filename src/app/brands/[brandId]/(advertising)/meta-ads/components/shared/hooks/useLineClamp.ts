'use client'

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'

const CLIP_TOLERANCE_PX = 1

interface LineClamp<T extends HTMLElement> {
  readonly ref: RefObject<T | null>
  readonly isClamped: boolean
  readonly isExpanded: boolean
  readonly toggle: () => void
}

/**
 * Tracks whether a CSS line-clamped element actually hides text, so "See more" is
 * offered only when needed. The clamp itself lives in the consumer's CSS.
 */
export function useLineClamp<T extends HTMLElement>(text: string): LineClamp<T> {
  const ref = useRef<T>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)

  const toggle = useCallback(() => setIsExpanded((prev) => !prev), [])

  // Re-measured on resize too: an element mounted under display:none (a hidden tab)
  // reads 0/0 until it gets a real box. Skipped while expanded, where the clamp is off
  // and every text reads as unclamped.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || isExpanded) {
      return undefined
    }
    const measure = (): void => {
      setIsClamped(el.scrollHeight > el.clientHeight + CLIP_TOLERANCE_PX)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text, isExpanded])

  return { ref, isClamped, isExpanded, toggle }
}
