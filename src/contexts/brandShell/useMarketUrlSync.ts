'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Market } from '@/types'
import {
  ALL_MARKETS,
  MARKET_PARAM,
  parseMarketSelection,
  type MarketSelection,
} from '@/lib/markets'

function writeMarketToUrl(next: MarketSelection): void {
  if (typeof window === 'undefined') {
    return
  }
  const url = new URL(window.location.href)
  const current = url.searchParams.get(MARKET_PARAM)
  const desired = next === ALL_MARKETS ? null : next
  if (current === desired) {
    return
  }
  if (desired === null) {
    url.searchParams.delete(MARKET_PARAM)
  } else {
    url.searchParams.set(MARKET_PARAM, desired)
  }
  window.history.replaceState({}, '', url.toString())
}

export function useMarketUrlSync(
  markets: readonly Market[],
): readonly [MarketSelection, (next: MarketSelection) => void] {
  const searchParams = useSearchParams()
  const [selection, setSelection] = useState<MarketSelection>(() =>
    parseMarketSelection(searchParams?.get(MARKET_PARAM) ?? undefined, markets),
  )

  useEffect(() => {
    writeMarketToUrl(selection)
  }, [selection])

  const update = useCallback((next: MarketSelection): void => {
    setSelection(next)
  }, [])

  return [selection, update]
}
