'use client'

import { memo, useMemo, type ReactNode } from 'react'
import type { Market } from '@/types'
import { BrandShellContext, type BrandShellContextValue } from './brandShellCtx'
import { useMarketUrlSync } from './useMarketUrlSync'

interface Props {
  readonly brandId: string
  readonly markets: readonly Market[]
  readonly children: ReactNode
}

export default memo(function BrandShellProvider({
  brandId,
  markets,
  children,
}: Props): JSX.Element {
  const [selectedMarket, setSelectedMarket] = useMarketUrlSync(markets)

  const value = useMemo<BrandShellContextValue>(
    () => ({ brandId, markets, selectedMarket, setSelectedMarket }),
    [brandId, markets, selectedMarket, setSelectedMarket],
  )

  return <BrandShellContext.Provider value={value}>{children}</BrandShellContext.Provider>
})
