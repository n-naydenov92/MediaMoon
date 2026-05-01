'use client'

import { memo, useEffect } from 'react'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import type { AsyncState, NewsResult, NewsStats } from '@/types'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { LABELS } from '@/Section/trending-news/labels'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import NewsBlock from '../NewsBlock/NewsBlock'
import StatsRow from '../StatsRow/StatsRow'
import HighlightsSidebar from '../HighlightsSidebar/HighlightsSidebar'
import LoadingOverview from './LoadingOverview/LoadingOverview'
import styles from './OverviewDashboard.module.css'

export default memo(function OverviewDashboard(): JSX.Element {
  const { brandId, topic, dataByKey, ensureLoaded } = useTrendingNewsContext()

  useEffect(() => {
    for (const market of topic.markets) {
      ensureLoaded(market)
    }
  }, [topic.markets, ensureLoaded])

  const results = topic.markets
    .map((m) => dataByKey.get(cacheKey(brandId, m)))
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
        <Grid item xs={12} md={8} className={styles.mainColumn}>
          <Stack spacing={3}>
            {allClusters.map((cluster, index) => (
              <NewsBlock
                key={`${cluster.market}-${cluster.representativeTitle}`}
                cluster={cluster}
                defaultExpanded={index === 0}
              />
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} md={4} className={styles.sidebarColumn}>
          <HighlightsSidebar clusters={allClusters} />
        </Grid>
      </Grid>
    </Stack>
  )
})

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
