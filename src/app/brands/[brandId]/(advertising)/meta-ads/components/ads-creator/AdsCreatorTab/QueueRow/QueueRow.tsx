'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { cssVars } from '@/lib/css'
import type { LaunchJob } from '../useLaunchQueue'
import { STATUS_ICONS, STATUS_LABELS, adsManagerUrl, formatFileSize } from './helpers'
import styles from './QueueRow.module.css'

interface Props {
  readonly job: LaunchJob
  readonly accountId: string
  readonly onRetry: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
}

export default memo(function QueueRow({ job, accountId, onRetry, onDismiss }: Props): JSX.Element {
  return (
    <ListItem disablePadding disableGutters className={styles.row} data-status={job.status}>
      <Box component="header" className={styles.head}>
        <Box className={styles.titleCol}>
          <Typography component="span" variant="inherit" className={styles.icon} data-status={job.status}>
            {STATUS_ICONS[job.status]}
          </Typography>
          <Typography component="span" variant="inherit" className={styles.fileName}>{job.fileName}</Typography>
          <Typography component="span" variant="inherit" className={styles.meta}>
            {formatFileSize(job.fileSize)} · {job.mediaType}
          </Typography>
        </Box>
        <Typography component="span" variant="inherit" className={styles.status} data-status={job.status}>
          {STATUS_LABELS[job.status]}
        </Typography>
      </Box>

      <Box className={styles.bar} style={cssVars({ '--bar-pct': `${Math.round(job.progress)}%` })}>
        <Box component="span" className={styles.barFill} data-status={job.status} />
      </Box>

      {job.error && (
        <Typography component="p" variant="inherit" className={styles.error}>{job.error}</Typography>
      )}

      <Box component="footer" className={styles.footer}>
        {job.status === 'failed' && (
          <Button
            type="button"
            size="small"
            variant="outlined"
            color="inherit"
            className={styles.action}
            onClick={() => onRetry(job.id)}
          >
            Retry
          </Button>
        )}
        {(job.status === 'failed' || job.status === 'done') && (
          <Button
            type="button"
            size="small"
            variant="outlined"
            color="inherit"
            className={styles.action}
            onClick={() => onDismiss(job.id)}
          >
            Dismiss
          </Button>
        )}
        {job.status === 'done' && (
          <Button
            component="a"
            variant="text"
            color="inherit"
            className={styles.link}
            href={adsManagerUrl(accountId)}
            target="_blank"
            rel="noreferrer"
          >
            Open in Ads Manager ↗
          </Button>
        )}
      </Box>
    </ListItem>
  )
})
