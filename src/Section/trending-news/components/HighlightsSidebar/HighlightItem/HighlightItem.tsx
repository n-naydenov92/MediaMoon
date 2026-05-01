'use client'

import { memo } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import HeatBadge from '@/components/ui/HeatBadge/HeatBadge'
import type { HeatLevel, NewsCluster } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import {
  formatRelative,
  pickLatestPubDate,
} from '@/Section/trending-news/helpers'

interface Props {
  readonly cluster: NewsCluster
}

const HEAT_LINE_COLOR: Record<HeatLevel, string> = {
  viral: '#F59E0B',
  hot: '#F97316',
  normal: '#64748B',
}

export default memo(function HighlightItem({ cluster }: Props): JSX.Element {
  const latestDate = pickLatestPubDate(cluster.articles)
  const metaParts = [
    cluster.market,
    `${cluster.coverage} ${LABELS.newsBlock.sources}`,
  ]
  if (latestDate) {
    metaParts.push(formatRelative(latestDate))
  }

  return (
    <Stack
      spacing={1}
      sx={(theme) => ({
        borderLeft: 3,
        borderLeftColor: HEAT_LINE_COLOR[cluster.heat],
        pl: 2.5,
        py: 1.5,
        borderRadius: 1,
        transition: 'background-color 80ms ease-out',
        '&:hover': { backgroundColor: theme.palette.action.hover },
      })}
    >
      <Typography
        variant="body2"
        sx={{ color: 'text.primary', fontWeight: 500 }}
      >
        {cluster.representativeTitle}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {metaParts.join(' · ')}
        </Typography>
        <HeatBadge heat={cluster.heat} />
      </Stack>
    </Stack>
  )
})
