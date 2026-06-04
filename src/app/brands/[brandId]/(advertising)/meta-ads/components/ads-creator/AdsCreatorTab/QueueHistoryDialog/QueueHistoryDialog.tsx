'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import HistoryIcon from '@mui/icons-material/History'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined'
import type { LaunchJob } from '../useLaunchQueue'
import CreatorDialog from '../CreatorDialog/CreatorDialog'
import QueueSection, { type SectionBulkAction } from './QueueSection/QueueSection'
import { groupJobs } from './helpers'
import styles from './QueueHistoryDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly jobs: readonly LaunchJob[]
  readonly accountId: string
  readonly onRetry: (jobId: string) => void
  readonly onStop: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
}

export default memo(function QueueHistoryDialog({
  open,
  onClose,
  jobs,
  accountId,
  onRetry,
  onStop,
  onDismiss,
}: Props): JSX.Element {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set())
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
    <CreatorDialog
      open={open}
      onClose={onClose}
      icon={<HistoryIcon fontSize="inherit" />}
      title="Queue history"
      titleId="queue-history-title"
      count={`${jobs.length} total`}
      maxWidth="sm"
      paperClassName={styles.paper}
    >
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
              onStop={onStop}
              onDismiss={onDismiss}
            />
            <QueueSection
              title="Failed"
              jobs={grouped.failed}
              collapsed={collapsed.has('failed')}
              onToggle={handleToggleFailed}
              accountId={accountId}
              onRetry={onRetry}
              onStop={onStop}
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
              onStop={onStop}
              onDismiss={onDismiss}
              bulkAction={clearDoneAction}
            />
          </>
        )}
      </Box>
    </CreatorDialog>
  )
})
