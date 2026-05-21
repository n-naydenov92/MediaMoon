'use client'

import { memo } from 'react'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import type { LaunchJob } from '../../useLaunchQueue'
import QueueRow from '../QueueRow/QueueRow'
import styles from './QueuePanel.module.css'

interface Props {
  readonly jobs: readonly LaunchJob[]
  readonly accountId: string
  readonly onRetry: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
}

export default memo(function QueuePanel({ jobs, accountId, onRetry, onDismiss }: Props): JSX.Element {
  if (jobs.length === 0) {
    return (
      <Typography variant="body2" className={styles.empty}>
        No ads in queue — pick creatives above and publish.
      </Typography>
    )
  }
  return (
    <List disablePadding className={styles.list}>
      {jobs.map((job) => (
        <QueueRow
          key={job.id}
          job={job}
          accountId={accountId}
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      ))}
    </List>
  )
})
