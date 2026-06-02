'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import CloseIcon from '@mui/icons-material/Close'
import HistoryIcon from '@mui/icons-material/History'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined'
import type { LaunchJob } from '../useLaunchQueue'
import QueueSection, { type SectionBulkAction } from './QueueSection/QueueSection'
import { groupJobs } from './helpers'
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
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set(['done']))
  const grouped = useMemo(() => groupJobs(jobs), [jobs])

  const toggleSection = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleToggleActive = useCallback(() => toggleSection('active'), [toggleSection])
  const handleToggleFailed = useCallback(() => toggleSection('failed'), [toggleSection])
  const handleToggleDone = useCallback(() => toggleSection('done'), [toggleSection])

  const handleRetryAll = useCallback(() => {
    grouped.failed.forEach((job) => onRetry(job.id))
  }, [grouped.failed, onRetry])

  const handleClearDone = useCallback(() => {
    grouped.done.forEach((job) => onDismiss(job.id))
  }, [grouped.done, onDismiss])

  const retryAllAction = useMemo<SectionBulkAction>(
    () => ({ label: 'Retry all', icon: <RefreshIcon fontSize="inherit" />, onClick: handleRetryAll }),
    [handleRetryAll],
  )
  const clearDoneAction = useMemo<SectionBulkAction>(
    () => ({ label: 'Clear all', icon: <DeleteSweepOutlinedIcon fontSize="inherit" />, onClick: handleClearDone }),
    [handleClearDone],
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
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

      <Box className={styles.body}>
        {jobs.length === 0 ? (
          <Box className={styles.empty}>
            <Typography component="p" variant="inherit" className={styles.emptyText}>
              The queue is empty.
            </Typography>
          </Box>
        ) : (
          <>
            <QueueSection
              title="Active"
              jobs={grouped.active}
              collapsed={collapsed.has('active')}
              onToggle={handleToggleActive}
              accountId={accountId}
              onRetry={onRetry}
              onDismiss={onDismiss}
            />
            <QueueSection
              title="Failed"
              jobs={grouped.failed}
              collapsed={collapsed.has('failed')}
              onToggle={handleToggleFailed}
              accountId={accountId}
              onRetry={onRetry}
              onDismiss={onDismiss}
              bulkAction={retryAllAction}
            />
            <QueueSection
              title="Done"
              jobs={grouped.done}
              collapsed={collapsed.has('done')}
              onToggle={handleToggleDone}
              accountId={accountId}
              onRetry={onRetry}
              onDismiss={onDismiss}
              bulkAction={clearDoneAction}
            />
          </>
        )}
      </Box>
    </Dialog>
  )
})
