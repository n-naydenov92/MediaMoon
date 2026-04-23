'use client'

import { memo } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import HeatBadge from '@/components/ui/HeatBadge/HeatBadge'
import SubjectBadge from '@/components/ui/SubjectBadge/SubjectBadge'
import type { NewsCluster } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'

interface Props {
  readonly cluster: NewsCluster
}

/**
 * Single cluster entry inside the highlights sidebar — market, coverage, badges, and title.
 */
export default memo(function HighlightItem({ cluster }: Props): JSX.Element {
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {cluster.market} {LABELS.highlightsSidebar.separator} {cluster.coverage} {LABELS.newsBlock.sources}
        </Typography>
        <Stack direction="row" spacing={1}>
          <SubjectBadge tabId={cluster.tabId} />
          <HeatBadge heat={cluster.heat} />
        </Stack>
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {cluster.representativeTitle}
      </Typography>
    </Stack>
  )
})
