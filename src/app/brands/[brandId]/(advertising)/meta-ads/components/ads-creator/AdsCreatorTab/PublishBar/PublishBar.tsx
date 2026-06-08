'use client'

import { memo, useMemo } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import type { LaunchJob } from '../useLaunchQueue'
import styles from './PublishBar.module.css'

// Below this width the Publish button's hover tooltip is unreachable (touch has no
// hover), so the blocked hint renders as static text above the button instead.
const MOBILE_BELOW = 900

const BLOCKED_HINT = 'You have incomplete steps or errors in the ad setup.'

interface Props {
  readonly adsCount: number
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
  adsCount, canSubmit, onSubmit, jobs,
}: Props): JSX.Element {
  const stats = useMemo(() => computeStats(jobs, latestBatchId(jobs)), [jobs])
  const isPublishing = stats.active > 0
  const isMobile = useMediaQuery(`(max-width:${MOBILE_BELOW}px)`)
  const showHint = !canSubmit
  const label = adsCount === 0
    ? 'Publish ads'
    : `Publish ${adsCount} ${adsCount === 1 ? 'ad' : 'ads'}`

  const button = (
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
  )

  return (
    <Box className={styles.root}>
      {isMobile && showHint && (
        <Alert severity="warning" className={styles.hintAlert}>
          {BLOCKED_HINT}
        </Alert>
      )}

      {!isMobile && showHint ? (
        <Tooltip title={BLOCKED_HINT}>
          <Box component="span" className={styles.buttonWrap}>{button}</Box>
        </Tooltip>
      ) : button}

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
