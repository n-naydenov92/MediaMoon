'use client'

import { memo, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { cssVars } from '@/lib/css'
import type { LaunchJob } from '../useLaunchQueue'
import { buildAdsManagerHref } from '../../../shared/adsManagerHref'
import { STATUS_ICONS, STATUS_LABELS, formatFileSize } from './helpers'
import styles from './QueueRow.module.css'

interface Props {
  readonly job: LaunchJob
  readonly accountId: string
  readonly onRetry: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
}

export default memo(function QueueRow({ job, accountId, onRetry, onDismiss }: Props): JSX.Element {
  const isActive = job.status === 'uploading' || job.status === 'publishing'
  const isDone = job.status === 'done'
  const isFailed = job.status === 'failed'

  let statusCell: ReactNode
  if (isActive) {
    statusCell = (
      <Box className={styles.activeCell}>
        <Box className={styles.track} style={cssVars({ '--bar-pct': `${Math.round(job.progress)}%` })}>
          <Box component="span" className={styles.barFill} data-status={job.status} />
        </Box>
        <Typography component="span" variant="inherit" className={styles.pct}>
          {Math.round(job.progress)}%
        </Typography>
      </Box>
    )
  } else if (isFailed && job.error) {
    statusCell = (
      <Tooltip title={job.error} placement="top" disableInteractive enterDelay={300}>
        <Typography component="span" variant="inherit" className={styles.errorText}>
          {job.error}
        </Typography>
      </Tooltip>
    )
  } else {
    statusCell = (
      <Typography component="span" variant="inherit" className={styles.statusLabel} data-status={job.status}>
        {STATUS_LABELS[job.status]}
      </Typography>
    )
  }

  return (
    <Box className={styles.row} data-status={job.status}>
      <Typography component="span" variant="inherit" className={styles.icon} data-status={job.status}>
        {STATUS_ICONS[job.status]}
      </Typography>
      <Typography component="span" variant="inherit" className={styles.fileName}>
        {job.fileName}
      </Typography>
      <Typography component="span" variant="inherit" className={styles.meta}>
        {formatFileSize(job.fileSize)} · {job.mediaType}
      </Typography>

      <Box className={styles.statusCol}>{statusCell}</Box>

      {isDone && job.adId && (
        <Tooltip title="Open in Ads Manager" placement="top" disableInteractive>
          <IconButton
            component="a"
            aria-label="Open in Ads Manager"
            className={styles.openBtn}
            href={buildAdsManagerHref(accountId, job.adId)}
            target="_blank"
            rel="noreferrer"
          >
            <OpenInNewIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}

      <Box className={styles.actions}>
        {isFailed && (
          <Tooltip title="Retry" placement="top" disableInteractive>
            <IconButton aria-label="Retry" className={styles.actionBtn} onClick={() => onRetry(job.id)}>
              <RefreshIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
        {(isFailed || isDone) && (
          <Tooltip title="Dismiss" placement="top" disableInteractive>
            <IconButton aria-label="Dismiss" className={styles.actionBtn} onClick={() => onDismiss(job.id)}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
})
