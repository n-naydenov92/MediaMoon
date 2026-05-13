'use client'

import { memo, useCallback } from 'react'
import UpdatedBadge from '@/components/layout/PageHeader/UpdatedBadge/UpdatedBadge'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { ALL_MARKETS } from '@/lib/markets'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import {
  isAnyLoading,
  pickActiveFetchedAt,
  pickLatestFetchedAt,
} from '@/Section/trending-news/helpers'

export default memo(function TrendingNewsUpdatedBadge(): JSX.Element {
  const { brandId, dataByKey, refresh, refreshAll } = useTrendingNewsContext()
  const { selectedMarket } = useBrandShellContext()

  const isOverview = selectedMarket === ALL_MARKETS
  const fetchedAt = isOverview
    ? pickLatestFetchedAt(dataByKey)
    : pickActiveFetchedAt(dataByKey, brandId, selectedMarket)
  const isRefreshing = isOverview
    ? isAnyLoading(dataByKey)
    : dataByKey.get(cacheKey(brandId, selectedMarket))?.status === 'loading'

  const handleRefresh = useCallback((): void => {
    void (isOverview ? refreshAll() : refresh())
  }, [isOverview, refresh, refreshAll])

  return (
    <UpdatedBadge
      fetchedAt={fetchedAt}
      onRefresh={handleRefresh}
      disabled={isRefreshing}
    />
  )
})
