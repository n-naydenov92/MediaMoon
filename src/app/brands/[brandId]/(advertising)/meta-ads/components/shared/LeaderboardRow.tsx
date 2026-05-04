'use client'

import type { AdLeaderboardEntry } from '@/lib/meta/aggregate'
import { formatEur, formatRoas } from '@/lib/meta/fx'
import AdThumbnail from './AdThumbnail'
import { useCreativePreviewTrigger } from './CreativePreview/useCreativePreviewTrigger'
import StatusDot from './StatusDot'
import styles from './LeaderboardCard.module.css'

interface Props {
  readonly entry: AdLeaderboardEntry
}

export default function LeaderboardRow({ entry }: Props): JSX.Element {
  const trigger = useCreativePreviewTrigger<HTMLDivElement>(entry.adId, entry.accountId)
  return (
    <li
      className={styles.row}
      tabIndex={0}
      onFocus={trigger.onFocus}
      onBlur={trigger.onBlur}
    >
      <div
        ref={trigger.ref}
        className={styles.thumbnailWrap}
        onPointerEnter={trigger.onPointerEnter}
        onPointerLeave={trigger.onPointerLeave}
      >
        <AdThumbnail src={entry.thumbnailUrl} alt={entry.name} type={entry.creativeType} />
      </div>
      <div className={styles.text}>
        <span className={styles.nameRow}>
          <StatusDot status={entry.status} />
          <span className={styles.name}>{entry.name}</span>
        </span>
        <span className={styles.meta}>
          {formatEur(entry.spendEur)} · ROAS {formatRoas(entry.roas)}
        </span>
      </div>
    </li>
  )
}
