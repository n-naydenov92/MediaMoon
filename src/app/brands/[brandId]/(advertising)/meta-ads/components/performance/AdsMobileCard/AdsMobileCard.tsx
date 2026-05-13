'use client'

import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import AdThumbnail from '../../shared/AdThumbnail/AdThumbnail'
import StatusDot from '../../shared/StatusDot/StatusDot'
import { useCreativePreviewTrigger } from '../../shared/CreativePreview/useCreativePreviewTrigger'
import { buildAdsManagerHref } from '../../shared/adsManagerHref'
import { isUnderperformerRow, isWinnerRow, tierForMetric } from '@/lib/meta/metricThresholds'
import { getColumnSpec, type AdRow, type ColumnId } from '../columnSpecs'
import WinnerLoserBadge from '../WinnerLoserBadge/WinnerLoserBadge'
import styles from '../AdsTable/AdsTable.module.css'

interface Props {
  readonly row: AdRow
  readonly visibleColumns: readonly ColumnId[]
}

export default function AdsMobileCard({ row, visibleColumns }: Props): JSX.Element {
  const trigger = useCreativePreviewTrigger<HTMLDivElement>(row.adId, row.accountId)
  const adsManagerHref = buildAdsManagerHref(row.accountId, row.adId)
  const winner = isWinnerRow(row)
  const underperformer = !winner && isUnderperformerRow(row)

  return (
    <ListItem
      className={styles.mobileCard}
      data-winner={winner ? 'true' : undefined}
      data-underperformer={underperformer ? 'true' : undefined}
      disableGutters
      disablePadding
    >
      <Stack direction="row" alignItems="center" spacing={1.5} className={styles.cardHeader}>
        <Box
          // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
          ref={trigger.ref}
          className={styles.thumbnailWrap}
          // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
          onPointerEnter={trigger.onPointerEnter}
          // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
          onPointerLeave={trigger.onPointerLeave}
          // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
          onFocus={trigger.onFocus}
          // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
          onBlur={trigger.onBlur}
          // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
          onClick={trigger.onClick}
          tabIndex={0}
        >
          <AdThumbnail src={row.thumbnailUrl} alt={row.name} type={row.creativeType} />
        </Box>
        <Stack className={styles.cardText} spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={1} className={styles.nameRow}>
            <StatusDot status={row.status} />
            <Box component="span" className={styles.name}>
              {row.name}
            </Box>
            {winner && <WinnerLoserBadge tone="winner" withTooltip={false} />}
            {underperformer && <WinnerLoserBadge tone="loser" withTooltip={false} />}
          </Stack>
          <Box component="span" className={styles.cardMeta}>
            {row.accountName} · {row.creativeType}
          </Box>
        </Stack>
        <Tooltip title="Open in Meta Ads Manager" arrow disableInteractive>
          <IconButton
            component="a"
            href={adsManagerHref}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            aria-label="Open in Meta Ads Manager"
            onClick={(event) => event.stopPropagation()}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box className={styles.mobileMetricGrid}>
        {visibleColumns.slice(0, 8).map((id) => {
          const spec = getColumnSpec(id)
          const tier = tierForMetric(id, row)
          return (
            <Box key={id} className={styles.metricMobileCell}>
              <Box component="span" className={styles.metricLabel}>
                {spec.shortLabel}
              </Box>
              <Box
                component="span"
                className={styles.metricValue}
                data-tier={tier && tier !== 'idle' ? tier : undefined}
              >
                {spec.format(row)}
              </Box>
            </Box>
          )
        })}
      </Box>
    </ListItem>
  )
}
