'use client'

import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import type { JobWithFiles } from '../../useLaunchJobs'
import JobRow from '../JobRow/JobRow'
import styles from './JobsPanel.module.css'

interface Props {
  readonly jobs: readonly JobWithFiles[]
  readonly clientProgress: Readonly<Record<string, number>>
  readonly onCancel: (jobId: string) => Promise<void>
}

export default function JobsPanel({ jobs, clientProgress, onCancel }: Props): JSX.Element {
  if (jobs.length === 0) {
    return <Typography variant="body2" className={styles.empty}>No batches yet — pick creatives above and publish.</Typography>
  }
  return (
    <List disablePadding className={styles.list}>
      {jobs.map((job) => (
        <JobRow
          key={job.id}
          job={job}
          clientProgress={clientProgress}
          onCancel={onCancel}
        />
      ))}
    </List>
  )
}
