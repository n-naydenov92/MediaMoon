'use client'

import { memo } from 'react'
import { ALL_MARKETS, type MarketSelection } from '@/lib/markets'
import OverviewDashboard from '../../OverviewDashboard/OverviewDashboard'
import MarketPanel from '../../MarketPanel/MarketPanel'

interface Props {
  readonly selectedMarket: MarketSelection
}

export default memo(({ selectedMarket }: Props): JSX.Element => {
  if (selectedMarket === ALL_MARKETS) {
    return <OverviewDashboard />
  }
  return <MarketPanel market={selectedMarket} />
})
