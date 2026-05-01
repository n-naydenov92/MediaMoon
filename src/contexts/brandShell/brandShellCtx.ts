'use client'

import { createContext } from 'react'
import type { Market } from '@/types'
import type { MarketSelection } from '@/lib/markets'

export interface BrandShellContextValue {
  readonly brandId: string
  readonly markets: readonly Market[]
  readonly selectedMarket: MarketSelection
  readonly setSelectedMarket: (next: MarketSelection) => void
}

export const BrandShellContext = createContext<BrandShellContextValue | null>(null)
