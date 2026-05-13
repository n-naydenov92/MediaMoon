'use client'

import Button from '@mui/material/Button'
import { FileStatus, JobStatus } from '@prisma/client'
import { cssVars } from '@/lib/css'
import type { JobWithFiles } from '../../useLaunchJobs'
import { adsManagerUrl, computeOverallPercent, countByStatus, progressLabel } from './helpers'
import styles from './JobRow.module.css'

interface Props {
  readonly job: JobWithFiles
  readonly clientProgress: Readonly<Record<string, number>>
  readonly onCancel: (jobId: string) => Promise<void>
}

const ACTIVE_STATUSES: ReadonlySet<JobStatus> = new Set([JobStatus.QUEUED, JobStatus.RUNNING])
const FINAL_FILE_STATUSES: ReadonlySet<FileStatus> = new Set([FileStatus.DONE, FileStatus.FAILED])

const STATUS_ICONS: Record<FileStatus, string> = {
  [FileStatus.QUEUED]: '·',
  [FileStatus.UPLOADING]: '↑',
  [FileStatus.UPLOADED]: '·',
  [FileStatus.PUBLISHING]: '⟳',
  [FileStatus.DONE]: '✓',
  [FileStatus.FAILED]: '✕',
}

export default function JobRow({ job, clientProgress, onCancel }: Props): JSX.Element {
  const counts = countByStatus(job.files)
  const overallPct = computeOverallPercent(job.files, clientProgress)
  const isActive = ACTIVE_STATUSES.has(job.status)

  return (
    <li className={styles.row} data-status={job.status}>
      <header className={styles.head}>
        <div className={styles.titleCol}>
          <span className={styles.title}>Batch #{job.batchNumber}</span>
          <span className={styles.meta}>
            {job.market} · {job.accountId} · {job.files.length} {job.files.length === 1 ? 'ad' : 'ads'}
          </span>
        </div>
        <span className={styles.status} data-status={job.status}>{job.status}</span>
      </header>

      <div className={styles.bar} style={cssVars({ '--bar-pct': `${overallPct}%` })}>
        <span className={styles.barFill} />
      </div>

      <div className={styles.summary}>
        <span>✓ {counts.done} done</span>
        <span>⟳ {counts.inFlight} working</span>
        <span>✕ {counts.failed} failed</span>
      </div>

      <ul className={styles.fileList}>
        {job.files.map((file) => {
          const label = progressLabel(file, clientProgress)
          return (
            <li key={file.id} className={styles.fileRow}>
              <span className={styles.fileIcon} data-status={file.status}>{STATUS_ICONS[file.status]}</span>
              <span className={styles.fileName}>{file.originalName}</span>
              {file.error && <span className={styles.fileError}>{file.error}</span>}
              {!FINAL_FILE_STATUSES.has(file.status) && label && (
                <span className={styles.fileProgress}>{label}</span>
              )}
            </li>
          )
        })}
      </ul>

      <footer className={styles.footer}>
        {isActive && (
          <Button
            type="button"
            size="small"
            variant="outlined"
            color="inherit"
            className={styles.cancel}
            // eslint-disable-next-line no-void -- void signals intentionally-ignored promise
            onClick={() => void onCancel(job.id)}
          >
            Cancel
          </Button>
        )}
        {job.status === JobStatus.DONE && (
          <a
            className={styles.link}
            href={adsManagerUrl(job.accountId)}
            target="_blank"
            rel="noreferrer"
          >
            Open in Ads Manager ↗
          </a>
        )}
      </footer>
    </li>
  )
}
