'use client'

import { memo, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import type { LaunchJob } from '../useLaunchQueue'
import styles from './PublishBar.module.css'

export interface IncompleteStep {
  readonly label: string
  readonly onOpen: () => void
}

interface Props {
  readonly adsCount: number
  readonly canSubmit: boolean
  readonly onSubmit: () => void
  readonly jobs: readonly LaunchJob[]
  readonly incompleteSteps: readonly IncompleteStep[]
}

interface QueueStats {
  readonly active: number
  readonly done: number
  readonly failed: number
  readonly total: number
  readonly percent: number
}

function latestBatchId(jobs: readonly LaunchJob[]): string | null {
  for (let i = jobs.length - 1; i >= 0; i -= 1) {
    const j = jobs[i]
    if (j?.kind === 'ad') return j.batchId
  }
  return null
}

function computeStats(jobs: readonly LaunchJob[], batchId: string | null): QueueStats {
  let active = 0
  let done = 0
  let failed = 0
  for (const j of jobs) {
    // Progress reflects only the current Publish batch's creatives — ads from
    // earlier batches (and ad set records) don't count.
    if (j.kind !== 'ad' || j.batchId !== batchId) continue
    if (j.status === 'done') done += 1
    else if (j.status === 'failed') failed += 1
    else active += 1
  }
  const total = active + done + failed
  const percent = total === 0 ? 0 : Math.round(((done + failed) / total) * 100)
  return { active, done, failed, total, percent }
}

export default memo(function PublishBar({
  adsCount, canSubmit, onSubmit, jobs, incompleteSteps,
}: Props): JSX.Element {
  const stats = useMemo(() => computeStats(jobs, latestBatchId(jobs)), [jobs])
  const isPublishing = stats.active > 0
  const [hintOpen, setHintOpen] = useState(false)

  // Blocked: the button itself states what's left to do, reads as muted (not a
  // standard CTA, no hover), yet a tap surfaces which steps remain — no reliance on
  // hover, which touch doesn't have.
  let label: string
  if (!canSubmit) {
    label = 'Finish setup to publish'
  } else if (adsCount === 0) {
    label = 'Publish ads'
  } else {
    label = `Publish ${adsCount} ${adsCount === 1 ? 'ad' : 'ads'}`
  }

  return (
    <Box className={styles.root}>
      {hintOpen && !canSubmit && (
        <Alert severity="warning" className={styles.hintAlert} onClose={() => setHintOpen(false)}>
          <Box className={styles.hintBody}>
            <Typography component="span" variant="body2" className={styles.hintLabel}>
              Finish setup:
            </Typography>
            <Box className={styles.hintChips}>
              {incompleteSteps.map((step) => (
                <Chip
                  key={step.label}
                  label={step.label}
                  size="small"
                  clickable
                  onClick={() => {
                    step.onOpen()
                    setHintOpen(false)
                  }}
                  className={styles.hintChip}
                />
              ))}
            </Box>
          </Box>
        </Alert>
      )}

      <Button
        type="button"
        variant="contained"
        disableElevation
        fullWidth
        size="large"
        startIcon={canSubmit ? <PlayArrowIcon /> : undefined}
        className={`${styles.button} ${!canSubmit ? styles.blockedLook : ''}`}
        aria-disabled={!canSubmit}
        disableRipple={!canSubmit}
        onClick={!canSubmit ? () => setHintOpen(true) : onSubmit}
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
