'use client'

import { memo } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { NewsCluster } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import HighlightItem from './HighlightItem/HighlightItem'

const TOP_N = 3

interface Props {
  readonly clusters: readonly NewsCluster[]
}

/**
 * Sticky sidebar showing the top N clusters ranked by score.
 */
export default memo(function HighlightsSidebar({ clusters }: Props): JSX.Element {
  const top = [...clusters].sort((a, b) => b.score - a.score).slice(0, TOP_N)

  return (
    <Card sx={{ position: 'sticky', top: 80 }}>
      <CardContent>
        <Stack spacing={4}>
          <Typography variant="h3">{LABELS.highlightsSidebar.title}</Typography>
          {top.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {LABELS.highlightsSidebar.empty}
            </Typography>
          )}
          {top.map((cluster) => (
            <HighlightItem
              key={`${cluster.market}-${cluster.representativeTitle}`}
              cluster={cluster}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
})
