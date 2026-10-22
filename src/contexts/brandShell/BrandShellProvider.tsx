'use client'

import { memo, useMemo, type ReactNode } from 'react'
import type { Market } from '@/types'
import type { MetaAccountRef } from '@/lib/tenancy/types'
import { BrandShellContext, type BrandShellContextValue } from './brandShellCtx'
import { useMarketUrlSync } from './useMarketUrlSync'

interface Props {
  readonly brandId: string
  readonly markets: readonly Market[]
  readonly metaAccounts: readonly MetaAccountRef[]
  readonly children: ReactNode
}

export default memo(function BrandShellProvider({
  brandId,
  markets,
  metaAccounts,
  children,
}: Props): JSX.Element {
  const [selectedMarket, setSelectedMarket] = useMarketUrlSync(markets)

  const value = useMemo<BrandShellContextValue>(
    () => ({ brandId, markets, metaAccounts, selectedMarket, setSelectedMarket }),
    [brandId, markets, metaAccounts, selectedMarket, setSelectedMarket],
  )

  return <BrandShellContext.Provider value={value}>{children}</BrandShellContext.Provider>
})
