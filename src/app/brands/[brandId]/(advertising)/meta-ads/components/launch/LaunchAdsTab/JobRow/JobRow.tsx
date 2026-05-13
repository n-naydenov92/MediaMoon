'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
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
    <ListItem disablePadding disableGutters className={styles.row} data-status={job.status}>
      <Box component="header" className={styles.head}>
        <Box className={styles.titleCol}>
          <Typography component="span" variant="inherit" className={styles.title}>Batch #{job.batchNumber}</Typography>
          <Typography component="span" variant="inherit" className={styles.meta}>
            {job.market} · {job.accountId} · {job.files.length} {job.files.length === 1 ? 'ad' : 'ads'}
          </Typography>
        </Box>
        <Typography component="span" variant="inherit" className={styles.status} data-status={job.status}>{job.status}</Typography>
      </Box>

      <Box className={styles.bar} style={cssVars({ '--bar-pct': `${overallPct}%` })}>
        <Box component="span" className={styles.barFill} />
      </Box>

      <Box className={styles.summary}>
        <Typography component="span" variant="inherit">✓ {counts.done} done</Typography>
        <Typography component="span" variant="inherit">⟳ {counts.inFlight} working</Typography>
        <Typography component="span" variant="inherit">✕ {counts.failed} failed</Typography>
      </Box>

      <List disablePadding className={styles.fileList}>
        {job.files.map((file) => {
          const label = progressLabel(file, clientProgress)
          return (
            <ListItem key={file.id} disablePadding disableGutters className={styles.fileRow}>
              <Typography component="span" variant="inherit" className={styles.fileIcon} data-status={file.status}>{STATUS_ICONS[file.status]}</Typography>
              <Typography component="span" variant="inherit" className={styles.fileName}>{file.originalName}</Typography>
              {file.error && <Typography component="span" variant="inherit" className={styles.fileError}>{file.error}</Typography>}
              {!FINAL_FILE_STATUSES.has(file.status) && label && (
                <Typography component="span" variant="inherit" className={styles.fileProgress}>{label}</Typography>
              )}
            </ListItem>
          )
        })}
      </List>

      <Box component="footer" className={styles.footer}>
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
          <Button
            component="a"
            variant="text"
            color="inherit"
            className={styles.link}
            href={adsManagerUrl(job.accountId)}
            target="_blank"
            rel="noreferrer"
          >
            Open in Ads Manager ↗
          </Button>
        )}
      </Box>
    </ListItem>
  )
}
