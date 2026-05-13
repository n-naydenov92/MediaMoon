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
import styles from './NewsBlockHeader.module.css'

interface Props {
  readonly cluster: NewsCluster
  readonly expanded: boolean
  readonly onToggle: () => void
}

export default memo(({
  cluster,
  expanded,
  onToggle,
}: Props): JSX.Element => {
  const subline = buildSubline(cluster)

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      spacing={3}
      onClick={onToggle}
      className={styles.header}
    >
      <Stack spacing={1} className={styles.titleColumn}>
        <Typography variant="h3" className={styles.title}>
          {cluster.representativeTitle}
        </Typography>
        <Typography variant="caption" className={styles.subline}>
          {subline}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" className={styles.actions}>
        <SubjectBadge tabId={cluster.tabId} />
        <HeatBadge heat={cluster.heat} />
        <IconButton
          size="small"
          aria-label={expanded ? LABELS.newsBlock.collapse : LABELS.newsBlock.expand}
          aria-expanded={expanded}
          className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
        >
          <ExpandMoreOutlined fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  )
})

function buildSubline(cluster: NewsCluster): string {
  const latestDate = pickLatestPubDate(cluster.articles)
  const sources = pickTopSources(cluster.articles)
  const parts: string[] = [`${cluster.coverage} ${LABELS.newsBlock.sources}`]
  if (latestDate) {
    parts.push(`${LABELS.newsBlock.last} ${formatRelative(latestDate)}`)
  }
  if (sources) {
    parts.push(sources)
  }
  return parts.join(' · ')
}
