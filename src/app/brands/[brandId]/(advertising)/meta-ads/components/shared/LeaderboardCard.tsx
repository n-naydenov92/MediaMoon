'use client'

import type { AdLeaderboardEntry } from '@/lib/meta/aggregate'
import LeaderboardRow from './LeaderboardRow'
import styles from './LeaderboardCard.module.css'

const DEFAULT_EMPTY_LABEL = 'No ads match the current criteria.'

interface Props {
  readonly title: string
  readonly subtitle?: string
  readonly entries: readonly AdLeaderboardEntry[]
  readonly emptyLabel?: string
}

export default function LeaderboardCard({
  title,
  subtitle,
  entries,
  emptyLabel = DEFAULT_EMPTY_LABEL,
}: Props): JSX.Element {
  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </header>
      {entries.length === 0 ? (
        <p className={styles.empty}>{emptyLabel}</p>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <LeaderboardRow key={entry.adId} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  )
}
