'use client'

import { memo, useMemo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import type { LaunchJob } from '../useLaunchQueue'
import styles from './PublishBar.module.css'

interface Props {
  readonly filesCount: number
  readonly canSubmit: boolean
  readonly onSubmit: () => void
  readonly jobs: readonly LaunchJob[]
}

interface QueueStats {
  readonly active: number
  readonly done: number
  readonly failed: number
  readonly total: number
  readonly percent: number
}

function computeStats(jobs: readonly LaunchJob[]): QueueStats {
  let active = 0
  let done = 0
  let failed = 0
  for (const j of jobs) {
    if (j.status === 'done') done += 1
    else if (j.status === 'failed') failed += 1
    else active += 1
  }
  const total = jobs.length
  const percent = total === 0 ? 0 : Math.round(((done + failed) / total) * 100)
  return { active, done, failed, total, percent }
}

export default memo(function PublishBar({
  filesCount, canSubmit, onSubmit, jobs,
}: Props): JSX.Element {
  const stats = useMemo(() => computeStats(jobs), [jobs])
  const isPublishing = stats.active > 0
  const label = filesCount === 0
    ? 'Publish ads'
    : `Publish ${filesCount} ${filesCount === 1 ? 'ad' : 'ads'}`

  return (
    <Box className={styles.root}>
      <Button
        type="button"
        variant="contained"
        disableElevation
        fullWidth
        size="large"
        startIcon={<PlayArrowIcon />}
        className={styles.button}
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {label}
      </Button>
      {isPublishing && (
        <Box className={styles.progressBlock} role="status" aria-live="polite">
          <Box className={styles.progressLabelRow}>
            <Typography component="span" variant="inherit" className={styles.progressLabel}>
              Publishing {stats.done + stats.failed} of {stats.total} ads…
            </Typography>
            <Typography component="span" variant="inherit" className={styles.progressPercent}>
              {stats.percent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.percent}
            className={styles.progressBar}
          />
          {stats.failed > 0 && (
            <Typography component="span" variant="inherit" className={styles.progressFailed}>
              {stats.failed} failed — open the queue to retry.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
})
