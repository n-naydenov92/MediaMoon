'use client'

import { useCallback, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Market } from '@/types'
import {
  ALL_MARKETS,
  MARKET_PARAM,
  parseMarketSelection,
  type MarketSelection,
} from '@/lib/markets'

export function useMarketUrlSync(
  markets: readonly Market[],
): readonly [MarketSelection, (next: MarketSelection) => void] {
  const searchParams = useSearchParams()
  const [selection, setSelection] = useState<MarketSelection>(() =>
    parseMarketSelection(searchParams?.get(MARKET_PARAM) ?? undefined, markets),
  )

  const update = useCallback((next: MarketSelection): void => {
    setSelection(next)
    if (typeof window === 'undefined') {
      return
    }
    const url = new URL(window.location.href)
    if (next === ALL_MARKETS) {
      url.searchParams.delete(MARKET_PARAM)
    } else {
      url.searchParams.set(MARKET_PARAM, next)
    }
    window.history.replaceState({}, '', url.toString())
  }, [])

  return [selection, update]
}
