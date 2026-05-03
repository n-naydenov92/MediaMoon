import type { AdLeaderboardEntry } from '@/lib/meta/aggregate'
import { formatEur, formatRoas } from '@/lib/meta/fx'
import AdThumbnail from './AdThumbnail'
import styles from './LeaderboardCard.module.css'

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
  emptyLabel = 'No ads match the current criteria.',
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
            <li key={entry.adId} className={styles.row}>
              <AdThumbnail src={entry.thumbnailUrl} alt={entry.name} type={entry.creativeType} />
              <div className={styles.text}>
                <span className={styles.name}>{entry.name}</span>
                <span className={styles.meta}>
                  {formatEur(entry.spendEur)} · ROAS {formatRoas(entry.roas)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
