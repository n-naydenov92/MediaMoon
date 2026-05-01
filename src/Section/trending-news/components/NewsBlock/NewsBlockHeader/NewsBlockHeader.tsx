'use client'

import { memo } from 'react'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined'
import HeatBadge from '@/components/ui/HeatBadge/HeatBadge'
import SubjectBadge from '@/components/ui/SubjectBadge/SubjectBadge'
import type { NewsCluster } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import {
  formatRelative,
  pickLatestPubDate,
  pickTopSources,
} from '@/Section/trending-news/helpers'

interface Props {
  readonly cluster: NewsCluster
  readonly expanded: boolean
  readonly onToggle: () => void
}

const ROTATE_DURATION_MS = 200

export default memo(function NewsBlockHeader({
  cluster,
  expanded,
  onToggle,
}: Props): JSX.Element {
  const latestDate = pickLatestPubDate(cluster.articles)
  const sources = pickTopSources(cluster.articles)
  const subline = buildSubline(cluster, latestDate, sources)

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      spacing={3}
      onClick={onToggle}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover .news-block-title': { color: 'primary.main' },
      }}
    >
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="h3"
          className="news-block-title"
          sx={{ transition: `color ${ROTATE_DURATION_MS}ms ease-out` }}
        >
          {cluster.representativeTitle}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
        >
          {subline}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
        <SubjectBadge tabId={cluster.tabId} />
        <HeatBadge heat={cluster.heat} />
        <IconButton
          size="small"
          aria-label={expanded ? LABELS.newsBlock.collapse : LABELS.newsBlock.expand}
          aria-expanded={expanded}
          sx={{
            transition: `transform ${ROTATE_DURATION_MS}ms ease-out`,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ExpandMoreOutlined fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  )
})

function buildSubline(
  cluster: NewsCluster,
  latestDate: string | null,
  sources: string,
): string {
  const parts: string[] = [
    `${cluster.coverage} ${LABELS.newsBlock.sources}`,
  ]
  if (latestDate) {
    parts.push(`${LABELS.newsBlock.last} ${formatRelative(latestDate)}`)
  }
  if (sources) {
    parts.push(sources)
  }
  return parts.join(' · ')
}
