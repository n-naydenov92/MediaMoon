'use client'

import { useEffect, useState } from 'react'
import type { Pixel } from '@/lib/gateways/MetaAdsGateway'

interface FetchPixelsResponse {
  readonly result?: readonly Pixel[]
  readonly error?: string
}

export interface UsePixelsResult {
  readonly pixels: readonly Pixel[]
  readonly pixelsLoading: boolean
}

// Pixels — fire-and-forget; an empty list is acceptable, so failures stay silent.
export function usePixels(open: boolean, accountId: string): UsePixelsResult {
  const [pixels, setPixels] = useState<readonly Pixel[]>([])
  const [pixelsLoading, setPixelsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!open || !accountId) {
      setPixels([])
      return undefined
    }
    const ctrl = new AbortController()
    setPixelsLoading(true)
    void (async () => {
      try {
        const response = await fetch(
          `/api/meta-ads/pixels?accountId=${encodeURIComponent(accountId)}`,
          { signal: ctrl.signal },
        )
        const json = (await response.json().catch(() => ({}))) as FetchPixelsResponse
        if (ctrl.signal.aborted) return
        setPixels(response.ok && json.result ? json.result : [])
      } catch {
        // pixels are optional — silently empty
      } finally {
        if (!ctrl.signal.aborted) setPixelsLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [open, accountId])

  return { pixels, pixelsLoading }
}
