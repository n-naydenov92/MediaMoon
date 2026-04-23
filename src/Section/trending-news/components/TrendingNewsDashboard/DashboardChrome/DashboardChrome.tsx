'use client'

import { memo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Topbar from '@/components/layout/Topbar/Topbar'
import { findTabById, isOverviewTab } from '@/Section/trending-news/config'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { LABELS } from '@/Section/trending-news/labels'
import type { AsyncState, NewsResult } from '@/types'
import TabNavigation from '../../TabNavigation/TabNavigation'
import ActivePanel from '../ActivePanel/ActivePanel'

/**
 * Inner shell rendered inside TrendingNewsProvider — handles topbar, tabs, and active panel.
 */
export default memo(function DashboardChrome(): JSX.Element {
  const { activeTabId, activeMarket, dataByKey, refresh, refreshAll } = useTrendingNewsContext()
  const tab = findTabById(activeTabId)
  const isOverview = tab ? isOverviewTab(tab) : false
  const currentState = dataByKey.get(cacheKey(activeTabId, activeMarket))

  const cacheExpiresAt = computeCacheExpiresAt(isOverview, currentState, dataByKey)

  const isRefreshing = isOverview
    ? [...dataByKey.values()].some((s) => s.status === 'loading')
    : currentState?.status === 'loading'

  const handleRefresh = useCallback((): void => {
    void (isOverview ? refreshAll() : refresh())
  }, [isOverview, refreshAll, refresh])

  return (
    <>
      <Topbar
        title={LABELS.moduleName}
        cacheExpiresAt={cacheExpiresAt}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
      />
      <Box sx={{ px: { xs: 4, md: 6 }, py: 6, maxWidth: 1440, width: '100%', mx: 'auto' }}>
        <Stack spacing={6}>
          <TabNavigation />
          <ActivePanel tab={tab} tabId={activeTabId} />
        </Stack>
      </Box>
    </>
  )
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function computeCacheExpiresAt(
  isOverview: boolean,
  currentState: AsyncState<NewsResult> | undefined,
  dataByKey: ReadonlyMap<string, AsyncState<NewsResult>>,
): string | null {
  if (!isOverview) {
    return currentState?.status === 'success' ? currentState.data.cacheExpiresAt : null
  }
  let latest: string | null = null
  for (const state of dataByKey.values()) {
    if (state.status !== 'success') {
      continue
    }
    if (!latest || state.data.cacheExpiresAt > latest) {
      latest = state.data.cacheExpiresAt
    }
  }
  return latest
}
