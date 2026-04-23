'use client'

import { memo, useEffect, useMemo } from 'react'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import type { AsyncState, Market, NewsResult, NewsStats } from '@/types'
import { getTopicTabs } from '@/Section/trending-news/config'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { LABELS } from '@/Section/trending-news/labels'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import NewsBlock from '../NewsBlock/NewsBlock'
import StatsRow from '../StatsRow/StatsRow'
import HighlightsSidebar from '../HighlightsSidebar/HighlightsSidebar'
import LoadingOverview from './LoadingOverview/LoadingOverview'

/**
 * Aggregates cached results from every topic tab × market combination.
 * Triggers background fetches for anything not yet in cache.
 */
export default memo(function OverviewDashboard(): JSX.Element {
  const { dataByKey, ensureLoaded } = useTrendingNewsContext()
  const combinations = useMemo(listAllCombinations, [])

  useEffect(() => {
    for (const combo of combinations) {
      ensureLoaded(combo.tabId, combo.market)
    }
  }, [combinations, ensureLoaded])

  const results = combinations
    .map((c) => dataByKey.get(cacheKey(c.tabId, c.market)))
    .filter(isSuccess)

  if (results.length === 0) {
    return <LoadingOverview />
  }

  const allClusters = results.flatMap((r) => r.data.clusters)
  const stats = mergeStats(results.map((r) => r.data.stats))

  if (allClusters.length === 0) {
    return <EmptyState title={LABELS.overviewDashboard.emptyLast24h} />
  }

  return (
    <Stack spacing={6}>
      <StatsRow stats={stats} />
      <Grid container spacing={6}>
        <Grid item xs={12} md={8}>
          <Stack spacing={4}>
            {allClusters.map((cluster) => (
              <NewsBlock
                key={`${cluster.market}-${cluster.representativeTitle}`}
                cluster={cluster}
              />
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <HighlightsSidebar clusters={allClusters} />
        </Grid>
      </Grid>
    </Stack>
  )
})

// ─── Helpers ────────────────────────────────────────────────────────────────

interface Combination {
  readonly tabId: string
  readonly market: Market
}

function listAllCombinations(): readonly Combination[] {
  const out: Combination[] = []
  for (const tab of getTopicTabs()) {
    for (const market of tab.markets) {
      out.push({ tabId: tab.id, market })
    }
  }
  return out
}

function isSuccess(
  state: AsyncState<NewsResult> | undefined,
): state is { status: 'success'; data: NewsResult } {
  return state?.status === 'success'
}

function mergeStats(all: readonly NewsStats[]): NewsStats {
  return all.reduce<NewsStats>(
    (acc, s) => ({
      totalArticles: acc.totalArticles + s.totalArticles,
      totalClusters: acc.totalClusters + s.totalClusters,
      viralCount: acc.viralCount + s.viralCount,
      hotCount: acc.hotCount + s.hotCount,
    }),
    { totalArticles: 0, totalClusters: 0, viralCount: 0, hotCount: 0 },
  )
}
