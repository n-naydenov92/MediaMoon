'use client'

import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ListItem from '@mui/material/ListItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
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
    <ListItem
      disablePadding
      disableGutters
      className={styles.row}
      tabIndex={0}
      // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
      onFocus={trigger.onFocus}
      // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
      onBlur={trigger.onBlur}
    >
      <Box
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
      </Box>
      <Box className={styles.text}>
        <Box component="span" className={styles.nameRow}>
          <StatusDot status={entry.status} />
          <Typography component="span" variant="inherit" className={styles.name}>{entry.name}</Typography>
        </Box>
        <Typography component="span" variant="inherit" className={styles.meta}>
          {formatEur(entry.spendEur)} · ROAS {formatRoas(entry.roas)}
        </Typography>
      </Box>
      <Tooltip title="Open in Meta Ads Manager" arrow disableInteractive>
        <IconButton
          component="a"
          className={styles.openLink}
          href={adsManagerHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in Meta Ads Manager"
          onClick={(event) => event.stopPropagation()}
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </ListItem>
  )
}
