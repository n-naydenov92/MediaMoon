'use client'

import { memo } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import HeatBadge from '@/components/ui/HeatBadge/HeatBadge'
import SubjectBadge from '@/components/ui/SubjectBadge/SubjectBadge'
import type { NewsCluster } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import NewsBlockMetric from '../NewsBlockMetric/NewsBlockMetric'

interface Props {
  readonly cluster: NewsCluster
}

/**
 * Header row for a news cluster card — title, badges, and coverage/trends metrics.
 */
export default memo(function NewsBlockHeader({ cluster }: Props): JSX.Element {
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
        <Typography variant="h3">{cluster.representativeTitle}</Typography>
        <Stack direction="row" spacing={1}>
          <SubjectBadge tabId={cluster.tabId} />
          <HeatBadge heat={cluster.heat} />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={4} sx={{ color: 'text.secondary' }}>
        <NewsBlockMetric
          label={LABELS.newsBlock.coverage}
          value={`${cluster.coverage} ${LABELS.newsBlock.sources}`}
        />
        {cluster.trendsScore !== null && (
          <NewsBlockMetric
            label={LABELS.newsBlock.trends}
            value={`${Math.round(cluster.trendsScore)}${LABELS.newsBlock.outOf}`}
          />
        )}
      </Stack>
    </Stack>
  )
})
