'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined'
import type { NewsCluster } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import HighlightItem from './HighlightItem/HighlightItem'

const TOP_N = 3

interface Props {
  readonly clusters: readonly NewsCluster[]
}

export default memo(function HighlightsSidebar({ clusters }: Props): JSX.Element {
  const top = [...clusters].sort((a, b) => b.score - a.score).slice(0, TOP_N)

  return (
    <Box sx={{ position: 'sticky', top: 80 }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <EmojiEventsOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="h3">{LABELS.highlightsSidebar.title}</Typography>
        </Stack>
        {top.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {LABELS.highlightsSidebar.empty}
          </Typography>
        )}
        <Stack spacing={2}>
          {top.map((cluster) => (
            <HighlightItem
              key={`${cluster.market}-${cluster.representativeTitle}`}
              cluster={cluster}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  )
})
