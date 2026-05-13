'use client'

import { memo } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import HeatBadge from '@/components/ui/HeatBadge/HeatBadge'
import type { NewsCluster } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import {
  formatRelative,
  pickLatestPubDate,
} from '@/Section/trending-news/helpers'
import styles from './HighlightItem.module.css'

interface Props {
  readonly cluster: NewsCluster
}

export default memo(function HighlightItem({ cluster }: Props): JSX.Element {
  const meta = buildMeta(cluster)

  return (
    <Stack spacing={1} className={styles.item} data-heat={cluster.heat}>
      <Typography variant="body2" className={styles.title}>
        {cluster.representativeTitle}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        <Typography variant="caption" className={styles.meta}>
          {meta}
        </Typography>
        <HeatBadge heat={cluster.heat} />
      </Stack>
    </Stack>
  )
})

function buildMeta(cluster: NewsCluster): string {
  const parts: string[] = [
    cluster.market,
    `${cluster.coverage} ${LABELS.newsBlock.sources}`,
  ]
  const latestDate = pickLatestPubDate(cluster.articles)
  if (latestDate) {
    parts.push(formatRelative(latestDate))
  }
  return parts.join(' · ')
}
