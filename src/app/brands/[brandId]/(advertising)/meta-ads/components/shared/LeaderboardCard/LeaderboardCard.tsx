'use client'

import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import type { AdLeaderboardEntry } from '@/lib/meta/aggregate'
import LeaderboardRow from '../LeaderboardRow/LeaderboardRow'
import styles from './LeaderboardCard.module.css'

const DEFAULT_EMPTY_LABEL = 'No ads match the current criteria.'

interface Props {
  readonly title: string
  readonly subtitle?: string
  readonly entries: readonly AdLeaderboardEntry[]
  readonly emptyLabel?: string
  readonly seeMoreHref?: string
}

export default function LeaderboardCard({
  title,
  subtitle,
  entries,
  emptyLabel = DEFAULT_EMPTY_LABEL,
  seeMoreHref,
}: Props): JSX.Element {
  return (
    <Box className={styles.card}>
      <Box component="header" className={styles.header}>
        <Typography component="h3" variant="h3" className={styles.title}>{title}</Typography>
        {subtitle && <Typography component="span" variant="inherit" className={styles.subtitle}>{subtitle}</Typography>}
      </Box>
      {entries.length === 0 ? (
        <Typography variant="body2" className={styles.empty}>{emptyLabel}</Typography>
      ) : (
        <List disablePadding className={styles.list}>
          {entries.map((entry) => (
            <LeaderboardRow key={entry.adId} entry={entry} />
          ))}
        </List>
      )}
      {seeMoreHref && (
        <Link href={seeMoreHref} className={styles.seeMore}>
          See more →
        </Link>
      )}
    </Box>
  )
}
