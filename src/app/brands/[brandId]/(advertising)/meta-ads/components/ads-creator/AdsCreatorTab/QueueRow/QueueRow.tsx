'use client'

import { memo, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined'
import { cssVars } from '@/lib/css'
import type { LaunchJob } from '../useLaunchQueue'
import { buildAdsManagerHref, buildAdSetHref } from '../../../shared/adsManagerHref'
import { STATUS_LABELS } from './helpers'
import styles from './QueueRow.module.css'

interface Props {
  readonly job: LaunchJob
  readonly accountId: string
  readonly onRetry: (jobId: string) => void
  readonly onStop: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
}

export default memo(function QueueRow({ job, accountId, onRetry, onStop, onDismiss }: Props): JSX.Element {
  // The ad set an ad went into, or the campaign an ad set was created under.
  const destinationCell = (
    <Tooltip title={job.destination} placement="top" disableInteractive>
      <Typography component="span" variant="caption" className={styles.destination}>
        {job.destination || '—'}
      </Typography>
    </Tooltip>
  )

  if (job.kind === 'adSet') {
    return (
      <Box className={styles.row} data-status={job.status}>
        <Box component="span" className={styles.kindIcon} data-status={job.status} aria-hidden>
          <LayersOutlinedIcon fontSize="inherit" />
        </Box>
        <Tooltip title={job.name} placement="top" disableInteractive>
          <Typography component="span" variant="body2" className={styles.title}>
            {job.name}
          </Typography>
        </Tooltip>
        {destinationCell}
        <Typography component="span" variant="caption" className={styles.kindLabel}>
          Ad set
        </Typography>
        <Box className={styles.statusCol}>
          <Typography component="span" variant="inherit" className={styles.statusLabel} data-status="done">
            {STATUS_LABELS.done}
          </Typography>
        </Box>
        <Box className={styles.openCell}>
          <Tooltip title="Open in Ads Manager" placement="top" disableInteractive>
            <IconButton
              component="a"
              aria-label="Open in Ads Manager"
              className={styles.openBtn}
              href={buildAdSetHref(job.accountId, job.adSetId)}
              target="_blank"
              rel="noreferrer"
            >
              <OpenInNewIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box className={styles.actions}>
          <Tooltip title="Dismiss" placement="top" disableInteractive>
            <IconButton aria-label="Dismiss" className={styles.actionBtn} onClick={() => onDismiss(job.id)}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    )
  }

  const isActive = job.status === 'uploading' || job.status === 'publishing'
  const isDone = job.status === 'done'
  const isFailed = job.status === 'failed'
  const MediaIcon = job.mediaType === 'video' ? MovieOutlinedIcon : ImageOutlinedIcon

  let statusCell: ReactNode
  if (isActive) {
    statusCell = (
      <Box className={styles.activeCell}>
        <Box className={styles.track} style={cssVars({ '--bar-pct': `${Math.round(job.progress)}%` })}>
          <Box component="span" className={styles.barFill} data-status={job.status} />
        </Box>
        <Typography component="span" variant="caption" className={styles.pct}>
          {Math.round(job.progress)}%
        </Typography>
      </Box>
    )
  } else if (isFailed && job.error) {
    statusCell = (
      <Tooltip title={job.error} placement="top" disableInteractive enterDelay={300}>
        <Typography component="span" variant="caption" className={styles.errorText}>
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
      <Box component="span" className={styles.kindIcon} data-status={job.status} aria-hidden>
        <MediaIcon fontSize="inherit" />
      </Box>
      <Tooltip title={job.name || job.fileName} placement="top" disableInteractive>
        <Typography component="span" variant="body2" className={styles.title}>
          {job.name || job.fileName}
        </Typography>
      </Tooltip>
      {destinationCell}
      <Typography component="span" variant="caption" className={styles.kindLabel}>
        Ad
      </Typography>

      <Box className={styles.statusCol}>{statusCell}</Box>

      <Box className={styles.openCell}>
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
      </Box>

      <Box className={styles.actions}>
        {isActive && (
          <Tooltip title="Stop — mark as failed" placement="top" disableInteractive>
            <IconButton
              aria-label="Stop"
              className={`${styles.actionBtn} ${styles.stopBtn}`}
              onClick={() => onStop(job.id)}
            >
              <StopCircleOutlinedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
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
