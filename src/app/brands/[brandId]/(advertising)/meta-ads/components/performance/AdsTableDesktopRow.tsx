'use client'

import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import AdThumbnail from '../shared/AdThumbnail'
import StatusDot from '../shared/StatusDot'
import { useCreativePreviewTrigger } from '../shared/CreativePreview/useCreativePreviewTrigger'
import { buildAdsManagerHref } from '../shared/adsManagerHref'
import { isUnderperformerRow, isWinnerRow, tierForMetric } from '@/lib/meta/metricThresholds'
import { getColumnSpec, type AdRow, type ColumnId } from './columnSpecs'
import WinnerLoserBadge from './WinnerLoserBadge'
import styles from './AdsTable.module.css'

interface Props {
  readonly row: AdRow
  readonly visibleColumns: readonly ColumnId[]
}

export default function AdsTableDesktopRow({ row, visibleColumns }: Props): JSX.Element {
  const trigger = useCreativePreviewTrigger<HTMLDivElement>(row.adId, row.accountId)
  const adsManagerHref = buildAdsManagerHref(row.accountId, row.adId)
  const winner = isWinnerRow(row)
  const underperformer = !winner && isUnderperformerRow(row)

  return (
    <TableRow
      hover
      className={styles.bodyRow}
      data-winner={winner ? 'true' : undefined}
      data-underperformer={underperformer ? 'true' : undefined}
    >
      <TableCell className={styles.thumbCell}>
        <Box
          ref={trigger.ref}
          className={styles.thumbnailWrap}
          onPointerEnter={trigger.onPointerEnter}
          onPointerLeave={trigger.onPointerLeave}
          onFocus={trigger.onFocus}
          onBlur={trigger.onBlur}
          tabIndex={0}
        >
          <AdThumbnail src={row.thumbnailUrl} alt={row.name} type={row.creativeType} />
        </Box>
      </TableCell>
      <TableCell className={styles.nameCell}>
        <Stack direction="row" alignItems="center" spacing={1} className={styles.nameRow}>
          <StatusDot status={row.status} />
          <Tooltip title={row.name} arrow disableInteractive enterDelay={400}>
            <Box component="span" className={styles.name}>
              {row.name}
            </Box>
          </Tooltip>
          {winner && <WinnerLoserBadge tone="winner" />}
          {underperformer && <WinnerLoserBadge tone="loser" />}
        </Stack>
      </TableCell>
      <TableCell className={styles.accountCell}>
        <Tooltip title={row.accountName} arrow disableInteractive enterDelay={400}>
          <Box component="span" className={styles.account}>
            {row.accountName}
          </Box>
        </Tooltip>
      </TableCell>
      {visibleColumns.map((id) => {
        const spec = getColumnSpec(id)
        const tier = tierForMetric(id, row)
        return (
          <TableCell
            key={id}
            className={styles.metricCell}
            data-tier={tier && tier !== 'idle' ? tier : undefined}
          >
            {spec.format(row)}
          </TableCell>
        )
      })}
      <TableCell className={styles.openLinkCell}>
        <Tooltip title="Open in Meta Ads Manager" arrow disableInteractive>
          <IconButton
            component="a"
            href={adsManagerHref}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            aria-label="Open in Meta Ads Manager"
            onClick={(event) => event.stopPropagation()}
            className={styles.openLink}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}
