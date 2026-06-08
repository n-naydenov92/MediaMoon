'use client'

import { memo, useCallback, useState } from 'react'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import NotificationsIcon from '@mui/icons-material/Notifications'
import type { LaunchJob } from '../useLaunchQueue'
import QueueHistoryDialog from '../QueueHistoryDialog/QueueHistoryDialog'
import { countActive } from '../QueueHistoryDialog/helpers'
import styles from './QueueLauncher.module.css'

interface Props {
  readonly jobs: readonly LaunchJob[]
  readonly accountId: string
  readonly onRetry: (jobId: string) => void
  readonly onStop: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
}

export default memo(function QueueLauncher({
  jobs,
  accountId,
  onRetry,
  onStop,
  onDismiss,
}: Props): JSX.Element {
  const [open, setOpen] = useState(false)
  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])
  const active = countActive(jobs)
  const tooltip = jobs.length === 0
    ? 'Queue is empty'
    : `${active} active · ${jobs.length} total — view history`

  return (
    <>
      <Tooltip title={tooltip} arrow placement="bottom">
        <IconButton
          aria-label={tooltip}
          onClick={handleOpen}
          className={styles.button}
          data-active={active > 0 ? 'true' : 'false'}
        >
          <Badge
            badgeContent={active}
            invisible={active === 0}
            classes={{ badge: styles.badge }}
            overlap="circular"
          >
            <NotificationsIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
      <QueueHistoryDialog
        open={open}
        onClose={handleClose}
        jobs={jobs}
        accountId={accountId}
        onRetry={onRetry}
        onStop={onStop}
        onDismiss={onDismiss}
      />
    </>
  )
})
