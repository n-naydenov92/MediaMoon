'use client'

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
    return <p className={styles.empty}>No batches yet — pick creatives above and publish.</p>
  }
  return (
    <ul className={styles.list}>
      {jobs.map((job) => (
        <JobRow
          key={job.id}
          job={job}
          clientProgress={clientProgress}
          onCancel={onCancel}
        />
      ))}
    </ul>
  )
}
