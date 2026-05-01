'use client'

import { useEffect } from 'react'
import type { Market } from '@/types'

export function useEnsureMarketsLoaded(
  markets: readonly Market[],
  ensureLoaded: (market: Market) => void,
): void {
  useEffect(() => {
    for (const market of markets) {
      ensureLoaded(market)
    }
  }, [markets, ensureLoaded])
}
