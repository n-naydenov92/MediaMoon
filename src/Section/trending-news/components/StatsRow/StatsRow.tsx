'use client'

import { memo, type ComponentType, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { SvgIconProps } from '@mui/material/SvgIcon'
import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import LayersOutlined from '@mui/icons-material/LayersOutlined'
import WhatshotOutlined from '@mui/icons-material/WhatshotOutlined'
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined'
import type { NewsStats } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import styles from './StatsRow.module.css'

interface Props {
  readonly stats: NewsStats
  readonly actions?: ReactNode
}

type AccentKey = 'viral' | 'hot'

interface Item {
  readonly key: keyof NewsStats
  readonly label: string
  readonly Icon: ComponentType<SvgIconProps>
  readonly accent?: AccentKey
}

const ITEMS: readonly Item[] = [
  { key: 'totalArticles', label: LABELS.statsRow.articles, Icon: ArticleOutlined },
  { key: 'totalClusters', label: LABELS.statsRow.clusters, Icon: LayersOutlined },
  { key: 'viralCount', label: LABELS.statsRow.viral, Icon: WhatshotOutlined, accent: 'viral' },
  { key: 'hotCount', label: LABELS.statsRow.hot, Icon: LocalFireDepartmentOutlined, accent: 'hot' },
]

export default memo(({ stats, actions }: Props): JSX.Element => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    className={styles.row}
  >
    <Stack direction="row" spacing={6} flexWrap="wrap" useFlexGap alignItems="center" className={styles.items}>
      {ITEMS.map(({ key, label, Icon, accent }) => (
        <Stack
          key={key}
          direction="row"
          spacing={2}
          alignItems="center"
          className={styles.item}
          data-accent={accent}
        >
          <Icon fontSize="small" className={styles.icon} />
          <Box component="span" className={styles.value}>{stats[key]}</Box>
          <Typography variant="caption" className={styles.label}>
            {label}
          </Typography>
        </Stack>
      ))}
    </Stack>
    {actions ? (
      <Stack direction="row" spacing={1} alignItems="center" className={styles.actions}>
        {actions}
      </Stack>
    ) : null}
  </Stack>
))
