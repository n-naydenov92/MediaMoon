'use client'

import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Tooltip from '@mui/material/Tooltip'
import type { AdLeaderboardEntry } from '@/lib/meta/aggregate'
import { formatEur, formatRoas } from '@/lib/meta/fx'
import AdThumbnail from '../AdThumbnail/AdThumbnail'
import { useCreativePreviewTrigger } from '../CreativePreview/useCreativePreviewTrigger'
import StatusDot from '../StatusDot/StatusDot'
import { buildAdsManagerHref } from '../adsManagerHref'
import styles from '../LeaderboardCard/LeaderboardCard.module.css'

interface Props {
  readonly entry: AdLeaderboardEntry
}

export default function LeaderboardRow({ entry }: Props): JSX.Element {
  const trigger = useCreativePreviewTrigger<HTMLDivElement>(entry.adId, entry.accountId)
  const adsManagerHref = buildAdsManagerHref(entry.accountId, entry.adId)
  return (
    <li
      className={styles.row}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- row exposed to keyboard navigation by design
      tabIndex={0}
      // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
      onFocus={trigger.onFocus}
      // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
      onBlur={trigger.onBlur}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard handled via focus/blur */}
      <div
        // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
        ref={trigger.ref}
        className={styles.thumbnailWrap}
        // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
        onPointerEnter={trigger.onPointerEnter}
        // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
        onPointerLeave={trigger.onPointerLeave}
        // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
        onClick={trigger.onClick}
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
      <Tooltip title="Open in Meta Ads Manager" arrow disableInteractive>
        <a
          className={styles.openLink}
          href={adsManagerHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in Meta Ads Manager"
          onClick={(event) => event.stopPropagation()}
        >
          <OpenInNewIcon fontSize="small" />
        </a>
      </Tooltip>
    </li>
  )
}
