'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import LayersOutlined from '@mui/icons-material/LayersOutlined'
import WhatshotOutlined from '@mui/icons-material/WhatshotOutlined'
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined'
import type { NewsStats } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'

interface Props {
  readonly stats: NewsStats
}

const VIRAL_COLOR = '#F59E0B'
const HOT_COLOR = '#F97316'

interface Item {
  readonly key: keyof NewsStats
  readonly label: string
  readonly Icon: React.ComponentType<{ sx?: object; fontSize?: 'small' | 'inherit' | 'large' | 'medium' }>
  readonly accent?: string
}

const ITEMS: readonly Item[] = [
  { key: 'totalArticles', label: LABELS.statsRow.articles, Icon: ArticleOutlined },
  { key: 'totalClusters', label: LABELS.statsRow.clusters, Icon: LayersOutlined },
  { key: 'viralCount', label: LABELS.statsRow.viral, Icon: WhatshotOutlined, accent: VIRAL_COLOR },
  { key: 'hotCount', label: LABELS.statsRow.hot, Icon: LocalFireDepartmentOutlined, accent: HOT_COLOR },
]

export default memo(function StatsRow({ stats }: Props): JSX.Element {
  return (
    <Stack
      direction="row"
      spacing={6}
      flexWrap="wrap"
      useFlexGap
      sx={{
        py: 2,
        px: 3,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {ITEMS.map(({ key, label, Icon, accent }) => (
        <Stack
          key={key}
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ minHeight: 32 }}
        >
          <Icon fontSize="small" sx={{ color: accent ?? 'text.secondary' }} />
          <Box
            component="span"
            sx={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: 18,
              fontWeight: 700,
              color: accent ?? 'text.primary',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {stats[key]}
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
})
