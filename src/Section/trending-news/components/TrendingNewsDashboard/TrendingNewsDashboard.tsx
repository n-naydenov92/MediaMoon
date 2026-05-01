'use client'

import { memo } from 'react'
import TrendingNewsProvider from '@/Section/trending-news/context/TrendingNewsProvider'
import DashboardChrome from './DashboardChrome/DashboardChrome'

interface Props {
  readonly brandId: string
}

/**
 * Root entry point for the Trending News module — mounts the brand-scoped provider and chrome.
 */
export default memo(function TrendingNewsDashboard({ brandId }: Props): JSX.Element {
  return (
    <TrendingNewsProvider brandId={brandId}>
      <DashboardChrome />
    </TrendingNewsProvider>
  )
})
