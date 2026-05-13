'use client'

import { memo } from 'react'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import NewspaperOutlined from '@mui/icons-material/NewspaperOutlined'
import type { AsyncState, NewsResult } from '@/types'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { LABELS } from '@/Section/trending-news/labels'
import { mergeStats } from '@/Section/trending-news/helpers'
import { useEnsureMarketsLoaded } from '@/Section/trending-news/hooks/useEnsureMarketsLoaded'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import NewsBlock from '../NewsBlock/NewsBlock'
import StatsRow from '../StatsRow/StatsRow'
import HighlightsSidebar from '../HighlightsSidebar/HighlightsSidebar'
import SourceStatsPopover from '../SourceStatsPopover/SourceStatsPopover'
import LoadingOverview from './LoadingOverview/LoadingOverview'
import styles from './OverviewDashboard.module.css'

export default memo(function OverviewDashboard(): JSX.Element {
  const { brandId, dataByKey, ensureLoaded } = useTrendingNewsContext()
  const { markets } = useBrandShellContext()

  useEnsureMarketsLoaded(markets, ensureLoaded)

  const results = markets
    .map((m) => dataByKey.get(cacheKey(brandId, m)))
    .filter(isSuccess)

  if (results.length === 0) {
    return <LoadingOverview />
  }

  const allClusters = results.flatMap((r) => r.data.clusters)
  const stats = mergeStats(results.map((r) => r.data.stats))
  const actions = <SourceStatsPopover />

  if (allClusters.length === 0) {
    return (
      <Stack spacing={6}>
        <StatsRow stats={stats} actions={actions} />
        <EmptyState title={LABELS.overviewDashboard.emptyLast24h} />
      </Stack>
    )
  }

  return (
    <Stack spacing={6}>
      <StatsRow stats={stats} actions={actions} />
      <Grid container columnSpacing={{ xs: 0, md: 6 }} rowSpacing={{ xs: 3, md: 6 }}>
        <Grid item xs={12} md={8} className={styles.mainColumn}>
          <Stack spacing={3}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              className={styles.mainHeading}
            >
              <NewspaperOutlined fontSize="small" className={styles.mainHeadingIcon} />
              <Typography variant="h3">All News</Typography>
            </Stack>
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
