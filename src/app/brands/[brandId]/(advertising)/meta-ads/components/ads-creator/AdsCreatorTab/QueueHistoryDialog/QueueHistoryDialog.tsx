'use client'

import { memo, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import CloseIcon from '@mui/icons-material/Close'
import HistoryIcon from '@mui/icons-material/History'
import type { LaunchJob } from '../useLaunchQueue'
import QueueRow from '../QueueRow/QueueRow'
import { QUEUE_FILTERS, filterJobs, type QueueFilter } from './helpers'
import styles from './QueueHistoryDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly jobs: readonly LaunchJob[]
  readonly accountId: string
  readonly onRetry: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
}

export default memo(function QueueHistoryDialog({
  open,
  onClose,
  jobs,
  accountId,
  onRetry,
  onDismiss,
}: Props): JSX.Element {
  const fullScreen = useMediaQuery('(max-width: 600px)')
  const [filter, setFilter] = useState<QueueFilter>('all')
  const filtered = useMemo(() => filterJobs(jobs, filter), [jobs, filter])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      aria-labelledby="queue-history-title"
      classes={{ paper: styles.paper }}
    >
      <Box component="header" className={styles.header}>
        <Box className={styles.headerTitleWrap}>
          <HistoryIcon className={styles.headerIcon} fontSize="inherit" />
          <Typography id="queue-history-title" component="h2" variant="inherit" className={styles.headerTitle}>
            Queue history
          </Typography>
          <Typography component="span" variant="inherit" className={styles.headerCount}>
            {jobs.length} total
          </Typography>
        </Box>
        <IconButton aria-label="Close" onClick={onClose} className={styles.closeButton}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box component="nav" className={styles.filters} aria-label="Filter queue by status">
        {QUEUE_FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            clickable
            onClick={() => setFilter(f.id)}
            className={styles.chip}
            data-active={filter === f.id ? 'true' : 'false'}
          />
        ))}
      </Box>

      <Box className={styles.body}>
        {filtered.length === 0 ? (
          <Box className={styles.empty}>
            <Typography component="p" variant="inherit" className={styles.emptyText}>
              No jobs match this filter.
            </Typography>
          </Box>
        ) : (
          <List disablePadding className={styles.list}>
            {filtered.map((job) => (
              <QueueRow
                key={job.id}
                job={job}
                accountId={accountId}
                onRetry={onRetry}
                onDismiss={onDismiss}
              />
            ))}
          </List>
        )}
      </Box>
    </Dialog>
  )
})
