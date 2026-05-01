'use client'

import { memo } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined'
import type { NewsCluster } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import HighlightItem from './HighlightItem/HighlightItem'
import styles from './HighlightsSidebar.module.css'

const TOP_N = 3

interface Props {
  readonly clusters: readonly NewsCluster[]
}

export default memo(function HighlightsSidebar({ clusters }: Props): JSX.Element {
  const top = pickTop(clusters)

  return (
    <div className={styles.sidebar}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <EmojiEventsOutlined fontSize="small" className={styles.headerIcon} />
          <Typography variant="h3">{LABELS.highlightsSidebar.title}</Typography>
        </Stack>
        {top.length === 0 && (
          <Typography variant="body2" className={styles.empty}>
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
    </div>
  )
})

function pickTop(clusters: readonly NewsCluster[]): readonly NewsCluster[] {
  return [...clusters].sort((a, b) => b.score - a.score).slice(0, TOP_N)
}
