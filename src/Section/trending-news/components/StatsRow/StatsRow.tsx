'use client'

import { memo, type ComponentType, type ReactNode } from 'react'
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

interface Item {
  readonly key: keyof NewsStats
  readonly label: string
  readonly Icon: ComponentType<SvgIconProps>
  readonly accent?: string
}

const VIRAL_COLOR = '#F59E0B'
const HOT_COLOR = '#F97316'

const ITEMS: readonly Item[] = [
  { key: 'totalArticles', label: LABELS.statsRow.articles, Icon: ArticleOutlined },
  { key: 'totalClusters', label: LABELS.statsRow.clusters, Icon: LayersOutlined },
  { key: 'viralCount', label: LABELS.statsRow.viral, Icon: WhatshotOutlined, accent: VIRAL_COLOR },
  { key: 'hotCount', label: LABELS.statsRow.hot, Icon: LocalFireDepartmentOutlined, accent: HOT_COLOR },
]

export default memo(function StatsRow({ stats, actions }: Props): JSX.Element {
  return (
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
          >
            <Icon
              fontSize="small"
              className={styles.icon}
              style={accent ? { color: accent } : undefined}
            />
            <span
              className={styles.value}
              style={accent ? { color: accent } : undefined}
            >
              {stats[key]}
            </span>
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
  )
})
