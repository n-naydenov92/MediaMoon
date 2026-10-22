'use client'

import { createContext } from 'react'
import type { MarketCode, MarketNames } from '@/types'
import type { MarketSelection } from '@/lib/markets'
import type { MetaAccountRef } from '@/lib/tenancy/types'

export interface BrandShellContextValue {
  readonly brandId: string
  readonly markets: readonly MarketCode[]
  readonly marketNames: MarketNames
  // Ids, markets and connections only — tokens never leave the server.
  readonly metaAccounts: readonly MetaAccountRef[]
  readonly selectedMarket: MarketSelection
  readonly setSelectedMarket: (next: MarketSelection) => void
}

export const BrandShellContext = createContext<BrandShellContextValue | null>(null)
