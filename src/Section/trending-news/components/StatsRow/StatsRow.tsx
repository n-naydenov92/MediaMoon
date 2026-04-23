'use client'

import { memo } from 'react'
import Grid from '@mui/material/Grid'
import type { NewsStats } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import StatCard from './StatCard/StatCard'

interface Props {
  readonly stats: NewsStats
}

const ITEMS: ReadonlyArray<{
  readonly key: keyof NewsStats
  readonly label: string
  readonly accent?: string
}> = [
  { key: 'totalArticles', label: LABELS.statsRow.articles },
  { key: 'totalClusters', label: LABELS.statsRow.clusters },
  { key: 'viralCount', label: LABELS.statsRow.viral, accent: '#F59E0B' },
  { key: 'hotCount', label: LABELS.statsRow.hot, accent: '#F97316' },
]

/**
 * Grid row of four stat cards summarising article counts, clusters, viral and hot stories.
 */
export default memo(function StatsRow({ stats }: Props): JSX.Element {
  return (
    <Grid container spacing={4}>
      {ITEMS.map((item) => (
        <Grid key={item.key} item xs={6} md={3}>
          <StatCard label={item.label} value={stats[item.key]} accent={item.accent} />
        </Grid>
      ))}
    </Grid>
  )
})
