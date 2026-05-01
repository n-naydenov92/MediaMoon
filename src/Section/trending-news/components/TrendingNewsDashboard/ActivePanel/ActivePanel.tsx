'use client'

import { memo } from 'react'
import type { ActiveView } from '@/Section/trending-news/context/trendingNewsCtx'
import OverviewDashboard from '../../OverviewDashboard/OverviewDashboard'
import MarketPanel from '../../MarketPanel/MarketPanel'

interface Props {
  readonly activeView: ActiveView
}

export default memo(function ActivePanel({ activeView }: Props): JSX.Element {
  if (activeView === 'overview') {
    return <OverviewDashboard />
  }
  return <MarketPanel market={activeView} />
})
