'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useCreativePreviewControl } from './CreativePreviewProvider'

const MOBILE_QUERY = '(max-width: 1023px)'

interface TriggerHandlers<T extends HTMLElement> {
  readonly ref: RefObject<T | null>
  readonly onPointerEnter: () => void
  readonly onPointerLeave: () => void
  readonly onFocus: () => void
  readonly onBlur: () => void
  readonly onClick: () => void
}

const noop = (): void => {}

export function useCreativePreviewTrigger<T extends HTMLElement>(
  adId: string,
  accountId: string,
): TriggerHandlers<T> {
  const { requestOpen, requestClose, requestOpenImmediate } = useCreativePreviewControl()
  const ref = useRef<T | null>(null)
  const isMobile = useMediaQuery(MOBILE_QUERY)

  const handleHoverOpen = useCallback((): void => {
    if (ref.current) {
      requestOpen(adId, accountId, ref.current)
    }
  }, [adId, accountId, requestOpen])

  const handleHoverClose = useCallback((): void => {
    requestClose()
  }, [requestClose])

  const handleClickOpen = useCallback((): void => {
    if (ref.current) {
      requestOpenImmediate(adId, accountId, ref.current)
    }
  }, [adId, accountId, requestOpenImmediate])

  useEffect(() => () => {
    requestClose()
  }, [requestClose])

  if (isMobile) {
    return {
      ref,
      onPointerEnter: noop,
      onPointerLeave: noop,
      onFocus: noop,
      onBlur: noop,
      onClick: handleClickOpen,
    }
  }

  return {
    ref,
    onPointerEnter: handleHoverOpen,
    onPointerLeave: handleHoverClose,
    onFocus: handleHoverOpen,
    onBlur: handleHoverClose,
    onClick: noop,
  }
}
