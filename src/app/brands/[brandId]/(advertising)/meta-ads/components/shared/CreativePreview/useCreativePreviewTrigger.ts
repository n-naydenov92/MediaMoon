'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { useCreativePreviewControl } from './CreativePreviewProvider'

interface TriggerHandlers<T extends HTMLElement> {
  readonly ref: RefObject<T | null>
  readonly onPointerEnter: () => void
  readonly onPointerLeave: () => void
  readonly onFocus: () => void
  readonly onBlur: () => void
}

export function useCreativePreviewTrigger<T extends HTMLElement>(
  adId: string,
  accountId: string,
): TriggerHandlers<T> {
  const { requestOpen, requestClose } = useCreativePreviewControl()
  const ref = useRef<T | null>(null)

  const handleEnter = useCallback((): void => {
    if (ref.current) {
      requestOpen(adId, accountId, ref.current)
    }
  }, [adId, accountId, requestOpen])

  const handleLeave = useCallback((): void => {
    requestClose()
  }, [requestClose])

  useEffect(() => {
    return () => {
      requestClose()
    }
  }, [requestClose])

  return {
    ref,
    onPointerEnter: handleEnter,
    onPointerLeave: handleLeave,
    onFocus: handleEnter,
    onBlur: handleLeave,
  }
}
