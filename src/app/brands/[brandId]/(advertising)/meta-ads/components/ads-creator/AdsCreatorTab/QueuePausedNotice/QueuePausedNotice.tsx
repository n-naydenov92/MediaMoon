'use client'

import { memo } from 'react'
import Alert from '@mui/material/Alert'
import { formatRemaining } from './helpers'
import { useCountdown } from './useCountdown'

interface Props {
  readonly pausedUntil: number
}

// Shown while Meta throttles the launch queue. The per-second tick lives here, so
// only this notice re-renders — not the queue rows or the creator pane.
export default memo(function QueuePausedNotice({ pausedUntil }: Props): JSX.Element {
  const remainingMs = useCountdown(pausedUntil)

  return (
    <Alert severity="warning" role="status">
      Meta temporarily limited requests. The queue resumes automatically in {formatRemaining(remainingMs)}.
    </Alert>
  )
})
