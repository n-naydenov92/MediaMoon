'use client'

import { memo, useMemo, type ReactNode } from 'react'
import type { MarketCode, MarketNames } from '@/types'
import type { MetaAccountRef } from '@/lib/tenancy/types'
import { BrandShellContext, type BrandShellContextValue } from './brandShellCtx'
import { useMarketUrlSync } from './useMarketUrlSync'

interface Props {
  readonly brandId: string
  readonly markets: readonly MarketCode[]
  readonly marketNames: MarketNames
  readonly metaAccounts: readonly MetaAccountRef[]
  readonly children: ReactNode
}

export default memo(function BrandShellProvider({
  brandId,
  markets,
  marketNames,
  metaAccounts,
  children,
}: Props): JSX.Element {
  const [selectedMarket, setSelectedMarket] = useMarketUrlSync(markets)

  const value = useMemo<BrandShellContextValue>(
    () => ({ brandId, markets, marketNames, metaAccounts, selectedMarket, setSelectedMarket }),
    [brandId, markets, marketNames, metaAccounts, selectedMarket, setSelectedMarket],
  )

  return <BrandShellContext.Provider value={value}>{children}</BrandShellContext.Provider>
})
